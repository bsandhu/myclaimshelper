var SampleData = require('./sampleData.js');
var config = require('./../config.js');
var mongoUtils = require('./../mongoUtils.js');
var sendResponse = require('./claimsService.js').sendResponse;
var UserProfile = require('../model/profiles.js').UserProfile;
var USERPROFILE_COL_NAME = mongoUtils.USERPROFILE_COL_NAME;

var _ = require('underscore');
var assert = require('assert')
var jQuery = require("jquery-deferred");

const DEFAULT_USER = 'DefaultUser';


// :: [Obj] -> Promise
var _saveOrUpdateUserProfile = _.partial(mongoUtils.saveOrUpdateEntity, _, USERPROFILE_COL_NAME);

// :: Id -> Promise
function _getUserProfile(search, db) {
    var result = jQuery.Deferred();

    mongoUtils.findEntities(USERPROFILE_COL_NAME, search, db)
        .then(function (profiles) {
            var profile = profiles[0];
            console.log('_getUserProfile: ' + JSON.stringify(profile));
            result.resolve(profile);
        });
    return result;
}

function _modifyUserProfile(id, attrsAsJson) {
    var defer = jQuery.Deferred();
    mongoUtils.modifyEntityAttr(id, mongoUtils.USERPROFILE_COL_NAME, attrsAsJson)
        .then(function (results) {
            defer.resolve(results);
        })
        .fail(function (err) {
            defer.reject(err);
        });
    return defer;
}


// REST ------------------------------

// :: Dict -> Dict -> None
function getUserProfileREST(req, res) {
    assert.ok(req.params.id, 'Expecting UserProfile Id as a parameter');
    var db = mongoUtils.connect();
    var search = {'_id': req.params.id, 'owner': req.headers.userid};

    db.then(_.partial(_getUserProfile, search))
        .then(
            _.partial(sendResponse, res, null),
            _.partial(sendResponse, res, 'Failed to get UserProfile  ' + req.params.id));
}

function modifyUserProfileREST(req, res) {
    var reqBody = req.body;
    var id = reqBody.id;
    var attrsAsJson = reqBody.attrsAsJson;
    console.log("Modify profile " + id+ ". Attrs: " + attrsAsJson);
    
    _modifyUserProfile(id, attrsAsJson)
        .then(_.partial(sendResponse, res, null, {}),
              _.partial(sendResponse, res, 'Failed to modify profile ' + id));
}

// :: Dict -> Dict -> None
function saveOrUpdateUserProfileREST(req, res) {
    var userProfile = req.body;
    userProfile.owner = req.headers.userid;

    _saveOrUpdateUserProfile(userProfile)
        .then(function () {
                sendResponse(res, null, userProfile)
            },
            _.partial(sendResponse, res, 'Failled to save ' + userProfile));
}

function checkAndGetUserProfileREST(req, res) {
    var userId = req.headers.userid;

    // Check if profile exists
    mongoUtils.getEntityById(userId, USERPROFILE_COL_NAME, userId)
        .then(function (err, profile) {
            _.isObject(profile)
                ? sendResponse(res, null, profile)
                : copyDefaultProfile();
        });

    // If not make a copy of the default profile
    function copyDefaultProfile() {

        // Setup sample data for new user
        SampleData.setupFor(userId)
            .then(function getDefaultProfile() {
                return mongoUtils.getEntityById(DEFAULT_USER, USERPROFILE_COL_NAME, DEFAULT_USER)
            })
            .then(function copyDefaultProfile(err, defaultProfile) {
                console.log('Creating new profile for: ' + userId);
                if (err) {
                    sendResponse(res, 'Error while setting up user: ' + err.message, null);
                    return;
                }
                defaultProfile._id = userId;
                defaultProfile.owner = userId;

                _saveOrUpdateUserProfile(defaultProfile)
                    .then(_.partial(sendResponse, res))
                    .fail(_.partial(sendResponse, res, 'Failed to get UserProfile  ' + userId));

            })
    }
}

exports.saveOrUpdateUserProfileREST = saveOrUpdateUserProfileREST;
exports.getUserProfileREST = getUserProfileREST;
exports.checkAndGetUserProfileREST = checkAndGetUserProfileREST;
exports._modifyUserProfile = _modifyUserProfile;
exports.modifyUserProfileREST = modifyUserProfileREST;
exports.DEFAULT_USER = DEFAULT_USER;
