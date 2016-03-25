var assert = require('assert');
var BillingProfile = require('./../model/billingProfile.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');
var sendResponse = require('./claimsService.js').sendResponse;
var DEFAULT_USER = require('./profileService.js').DEFAULT_USER;


var entityCollectionName = mongoUtils.BILLING_PROFILE_COL_NAME;
var BILLING_PROFILE_COL_NAME = mongoUtils.BILLING_PROFILE_COL_NAME;
var USERPROFILE_COL_NAME = mongoUtils.USERPROFILE_COL_NAME;


/********************************************************/
/* BillingProfile - Save/update API                           */
/********************************************************/

function saveOrUpdateREST(req, res) {
    assert.ok(req.hasOwnProperty('body'), 'Expecting instance of Request');

    var entityJSON = req.body;
    console.log('Save/update BillingProfile: ' + JSON.stringify(entityJSON));
    var entityObj = _.extend(new BillingProfile(), entityJSON);
    entityObj.owner = req.headers.userid;

    // Validate
    saveOrUpdateEntityObject(entityObj)
        .always(function (result) {
            result.status === 'Success'
                ? sendResponse(res, null, result.data)
                : sendResponse(res, result.details);
        });
}

function saveOrUpdateEntityObject(entityObj) {
    assert.ok(entityObj instanceof BillingProfile, 'Expecting instance of BillingProfile object');
    var defer = jQuery.Deferred();

    mongoUtils.saveOrUpdateEntity(entityObj, entityCollectionName)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}


/********************************************************/
/* BillingProfile - Read API                                  */
/********************************************************/

/**
 * Create one by copying user profile default if one is not present
 */
function checkAndGetBillingProfileForClaimREST(req, res) {

    assert.ok(req.params.claimId, 'Expecting claimId as a parameter');
    assert.ok(req.headers.userid, 'Expecting userid in header');

    var claimId = req.params.claimId;
    var userId = req.headers.userid;

    // Check if profile exists
    mongoUtils.getEntityById(claimId, BILLING_PROFILE_COL_NAME, userId)
        .then(function (err, profile) {
            _.isObject(profile)
                ? sendResponse(res, null, profile)
                : copyDefaultProfile();
        });

    // If not make a copy of the default profile
    function copyDefaultProfile() {
        mongoUtils.getEntityById(DEFAULT_USER, USERPROFILE_COL_NAME, DEFAULT_USER)

            .then(function copyDefaultProfile(err, defaultProfile) {
                console.log('Creating new billing profile for claim: ' + userId);
                if (err) {
                    sendResponse(res, 'Error while setting up billing profile: ' + err.message, null);
                    return;
                }
                var newProfile = new BillingProfile();
                newProfile._id = claimId;
                newProfile.owner = userId;
                newProfile.timeUnit = defaultProfile.billingProfile.timeUnit; // e.g., .1 hour.
                newProfile.distanceUnit = defaultProfile.billingProfile.distanceUnit;
                newProfile.timeRate = defaultProfile.billingProfile.timeRate; // $ per unit.
                newProfile.distanceRate = defaultProfile.billingProfile.distanceRate;
                newProfile.taxRate = defaultProfile.billingProfile.taxRate;

                saveOrUpdateEntityObject(newProfile)
                    .always(function (result) {
                        result.status === 'Success'
                            ? sendResponse(res, null, result.data)
                            : sendResponse(res, result.details);
                    });
            });
    }
}


exports.saveOrUpdateEntityObject = saveOrUpdateEntityObject;
exports.saveOrUpdateREST = saveOrUpdateREST;
exports.checkAndGetBillingProfileForClaimREST = checkAndGetBillingProfileForClaimREST;