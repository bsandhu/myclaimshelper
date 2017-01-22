let SampleData = require('./sampleData.js');
let config = require('./../config.js');
let mongoUtils = require('./../mongoUtils.js');
let sendResponse = require('./claimsService.js').sendResponse;
let UserProfile = require('../model/profiles.js').UserProfile;
let USERPROFILE_COL_NAME = mongoUtils.USERPROFILE_COL_NAME;

let _ = require('underscore');
let assert = require('assert')
let jQuery = require("jquery-deferred");
let addOwnerInfo = mongoUtils.addOwnerInfo;

const DEFAULT_USER = 'DefaultUser';
const DEFAULT_GROUP = 'DefaultGroup';


// :: [Obj] -> Promise
let _saveOrUpdateUserProfile = _.partial(mongoUtils.saveOrUpdateEntity, _, USERPROFILE_COL_NAME, false);

// :: Id -> Promise
function _getUserProfile(search, db) {
    let result = jQuery.Deferred();

    mongoUtils.findEntities(USERPROFILE_COL_NAME, search, db)
        .then(function (profiles) {
            let profile = profiles[0];
            console.log('_getUserProfile: ' + JSON.stringify(profile));
            result.resolve(profile);
        });
    return result;
}

function _modifyUserProfile(id, attrsAsJson) {
    let defer = jQuery.Deferred();
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

function modifyUserProfileREST(req, res) {
    let reqBody = req.body;
    let id = reqBody.id;
    let attrsAsJson = reqBody.attrsAsJson;
    console.log("Modify profile " + id+ ". Attrs: " + attrsAsJson);
    
    _modifyUserProfile(id, attrsAsJson)
        .then(_.partial(sendResponse, res, null, {}),
              _.partial(sendResponse, res, 'Failed to modify profile ' + id));
}

// :: Dict -> Dict -> None
function saveOrUpdateUserProfileREST(req, res) {
    let userProfile = req.body;
    userProfile = addOwnerInfo(req, userProfile);

    _saveOrUpdateUserProfile(userProfile)
        .then(function () {
                sendResponse(res, null, userProfile)
            },
            _.partial(sendResponse, res, 'Failled to save ' + userProfile));
}

function checkAndGetUserProfileREST(req, res) {
    let userId = req.headers.userid;

    // Check if profile exists
    mongoUtils.getEntityById(userId, USERPROFILE_COL_NAME, userId, [DEFAULT_GROUP])
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
                return mongoUtils.getEntityById(DEFAULT_USER, USERPROFILE_COL_NAME, DEFAULT_USER, [DEFAULT_GROUP])
            })
            .then(function copyDefaultProfile(err, defaultProfile) {
                console.log('Creating new profile for: ' + userId);
                if (err) {
                    sendResponse(res, 'Error while setting up user: ' + err.message, null);
                    return;
                }
                defaultProfile._id = userId;
                defaultProfile.owner = userId;
                defaultProfile.group = userId;
                defaultProfile.ingroups = [userId, DEFAULT_GROUP];

                _saveOrUpdateUserProfile(defaultProfile)
                    .then(_.partial(sendResponse, res))
                    .fail(_.partial(sendResponse, res, 'Failed to get UserProfile  ' + userId));

            })
    }
}

exports.saveOrUpdateUserProfileREST = saveOrUpdateUserProfileREST;
exports.checkAndGetUserProfileREST = checkAndGetUserProfileREST;
exports._modifyUserProfile = _modifyUserProfile;
exports.modifyUserProfileREST = modifyUserProfileREST;
exports.DEFAULT_USER = DEFAULT_USER;
exports.DEFAULT_GROUP = DEFAULT_GROUP;
