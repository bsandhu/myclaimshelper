var jQuery = require('jquery-deferred');
var _ = require('lodash');
var GoogleContactsClient = require('./googleContactsClient.js').GoogleContactsClient;
var mongoUtils = require('./../mongoUtils.js');
var sendResponse = require('./claimsService.js').sendResponse;
var config = require('./../config.js');

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// OAuth params
var CLIENT_ID = config.oauth_client_id;
var CLIENT_SECRET = config.oauth_client_secret;
var redirectUrl = config.oauth_redirect_url;
var scopes = ['https://www.google.com/m8/feeds/'];

// OAuth2 client setup
var GROUP_NAME = 'MyClaimsHelper';
var BATCH_SIZE = 50;

/**
 * Generate a url that asks permissions for Google+ and Google Calendar scopes
 */
function getAuthUrl(req, resp) {
    var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUrl);
    var url = oauth2Client.generateAuthUrl({
        access_type: 'online', // 'online' (default) or 'offline' (gets refresh_token)
        scope: scopes           // If you only need one scope you can pass it as string
    });
    console.log('Generated Auth URL: ' + url);
    resp.json({url: url});
    resp.end();
}

function addContactToGoogle(req, res) {
    var userCode = req.body.code;
    var owner = req.headers.userid;

    jQuery
        .when()
        .then(function () {
            // Client provides the auth code which is used to get the auth token
            var defer = jQuery.Deferred();
            var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUrl);

            oauth2Client.getToken(userCode, function (err, tokens) {
                // Now tokens contains an access_token and an optional refresh_token. Save them.
                if (!err) {
                    oauth2Client.setCredentials(tokens);
                    console.log('Got tokens: ' + JSON.stringify(tokens));
                    defer.resolve(tokens.access_token);
                } else {
                    console.error(err);
                    defer.reject(err);
                }
            });
            return defer;
        })
        .then(function (authToken) {
            return _addContactToGoogle(owner, authToken);
        })
        .then(function (jsonData) {
            sendResponse(res, null, jsonData);
        })
        .fail(function (err) {
            sendResponse(res, err, null);
        })
}

function _addContactToGoogle(userId, authToken) {
    var googleLib = new GoogleContactsClient(authToken);
    var claimsHelperGroup = undefined;
    var tracker = jQuery.Deferred();

    jQuery
        .when()
        .then(function getGroups() {
            console.log('>> Reading groups');
            return googleLib.getGroups();
        })
        .then(function createGroupIfNeeded(groups) {
            console.log('>> Found groups: ' + groups);
            //throw 'foo';
            var defer = jQuery.Deferred();

            var matchedGroup = _.find(groups, function (group) {
                return group.title == GROUP_NAME;
            });

            if (!matchedGroup) {
                console.log('>> Creating ' + GROUP_NAME);
                googleLib
                    .createGroup(GROUP_NAME)
                    .then(function (xmlResp) {
                        claimsHelperGroup = {
                            id: xmlResp.substring(xmlResp.indexOf('<id>') + 4, xmlResp.indexOf('</id>')),
                            title: GROUP_NAME
                        };
                        defer.resolve(claimsHelperGroup);
                    }, function onErr(err) {
                        defer.reject('Could not create the ' + GROUP_NAME + ' group. ' + err);
                    });
            } else {
                console.log('>> ' + GROUP_NAME + ' exists');
                claimsHelperGroup = matchedGroup;
                defer.resolve(matchedGroup);
            }
            return defer;
        })

        .then(function getAllContactsInGroup(group) {
            console.log('>> Get all contacts in ' + GROUP_NAME);
            var defer = jQuery.Deferred();
            googleLib
                .getContacts(group.id)
                .then(function onSuccess(contacts) {
                    console.log(JSON.stringify(contacts));
                    defer.resolve(contacts);
                }, function onErr(err) {
                    defer.reject('Could not get contact in ' + GROUP_NAME + ' group. ' + err);
                });
            return defer;
        })

        .then(function deleteExisting(contactsInGroup) {
            console.log('>> Delete existing contacts in ' + GROUP_NAME);
            var defer = jQuery.Deferred();

            // Split Ids to be deleted into chunks
            var chunks =
                _.chunk(
                    _.map(contactsInGroup, function (contact) {
                        return contact.id;
                    }), BATCH_SIZE);

            // Create Deferreds
            var deletes = _.map(chunks, function(chunk){
                return googleLib.deleteContact(chunk);
            });

            // Fire off!
            jQuery.when.apply(jQuery, deletes)
                .then(function onSuccess() {
                    defer.resolve(true);
                }, function onErr(err) {
                    defer.reject('Could not clear existing contacts in ' + GROUP_NAME + ' group. ' + err);
                })
            return defer;
        })

        .then(function readContacts() {
            console.log('>> Reading contacts');
            var defer = jQuery.Deferred();
            mongoUtils.run(function (db) {
                var contactsCol = db.collection(mongoUtils.CONTACTS_COL_NAME);
                contactsCol.find({owner: userId}).toArray(function (err, items) {
                    err ? defer.reject(err) : defer.resolve(items);
                });
            });
            return defer;
        })

        .then(function upload(contacts) {
            console.log('>> Uploading contacts to ' + GROUP_NAME);
            var defer = jQuery.Deferred();

            // Split Ids to be deleted into chunks
            var chunks = _.chunk(contacts, BATCH_SIZE);
            console.log('Split uploads in ' + chunks.length + ' batches of ' + BATCH_SIZE);
            
            // Create Deferreds
            var writes =
                _.map(chunks, function (chunk) {
                    return googleLib.createContact(chunk, claimsHelperGroup.id);
                });

            // Fire off
            jQuery.when.apply(jQuery, writes)
                .done(function () {
                    // We get a reply back for each chunk with a success/failure attr
                    var results = arguments;
                    var failedToSave = [];

                    for(var i = 0; i< arguments.length; i++) {
                        var arg = arguments[i];
                        if (arg.status == 'failure') {
                            failedToSave.push(arg);
                        }
                    }
                    defer.resolve(failedToSave, contacts.length);
                })
            return defer;
        })

        .then(function finish(failedToSave, totalCount) {
            var appoxFailCount = failedToSave.length * BATCH_SIZE;
            appoxFailCount = appoxFailCount > totalCount ? totalCount : appoxFailCount;

            if (appoxFailCount > 0) {
                tracker.resolve('There were some errors. Could not add ' + appoxFailCount + ' of ' + totalCount);
            } else {
                tracker.resolve('Added ' + totalCount + ' contacts');
            }
        })
        .fail(function handleFailure(err) {
            console.error('>> Failed to add contact: ' + err);
            tracker.reject({status: 'Failure', errors: err});
        });
    return tracker;
}


exports.getAuthUrl = getAuthUrl;
exports.addContactToGoogle = addContactToGoogle;
exports._addContactToGoogle = _addContactToGoogle;


