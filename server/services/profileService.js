var config = require('./../config.js');
var mongoUtils = require('./../mongoUtils.js');
var sendResponse = require('./claimsService.js').sendResponse;
var UserProfile = require('../model/profiles.js').UserProfile;
var USERPROFILE_COL_NAME = mongoUtils.USERPROFILE_COL_NAME;

var _ = require('underscore');
var assert = require('assert')
var jQuery = require("jquery-deferred");

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

exports.saveOrUpdateUserProfileREST = saveOrUpdateUserProfileREST;
exports.getUserProfileREST = getUserProfileREST;
