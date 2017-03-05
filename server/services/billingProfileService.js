let Set = require('Set');
let assert = require('assert');
let BillingProfile = require('./../model/billingProfile.js');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let jQuery = require('jquery-deferred');
let _ = require('underscore');
let sendResponse = require('./claimsService.js').sendResponse;
let DEFAULT_USER = require('./profileService.js').DEFAULT_USER;
let addOwnerInfo = mongoUtils.addOwnerInfo;

let entityCollectionName = mongoUtils.BILLING_PROFILE_COL_NAME;
let BILLING_PROFILE_COL_NAME = mongoUtils.BILLING_PROFILE_COL_NAME;
let USERPROFILE_COL_NAME = mongoUtils.USERPROFILE_COL_NAME;


/********************************************************/
/* BillingProfile - Save/update API                           */
/********************************************************/

function saveOrUpdateREST(req, res) {
    assert.ok(req.hasOwnProperty('body'), 'Expecting instance of Request');

    let entityJSON = req.body;
    console.log('Save/update BillingProfile: ' + JSON.stringify(entityJSON));
    let entityObj = _.extend(new BillingProfile(), entityJSON);
    entityObj = addOwnerInfo(req, entityObj);

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
    let defer = jQuery.Deferred();

    mongoUtils.saveOrUpdateEntity(entityObj, entityCollectionName)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}


/********************************************************/
/* BillingProfile - Read API                                  */
/********************************************************/

function codesInUse(req, res) {
    assert.ok(req.headers.userid, 'Expecting userId in headers');
    let owner = req.headers.userid;
    let ingroups = req.headers.ingroups;

    mongoUtils.connect()
        .then(function (db) {
            db.collection(mongoUtils.BILLING_ITEMS_COL_NAME)
                .find({$or: [{'owner': owner}, {'group': {$in: ingroups}}]},
                    {fields: {'_id': 0, 'mileageCode': 1, 'timeCode': 1, 'expenseCode': 1}})
                .toArray(function (err, resp) {
                    if (err) {
                        sendResponse(res, 'Failed to find usages of BillingCodes', {});
                    } else {
                        let result = new Set([]);
                        _.each(resp, function (val) {
                            result.add(val.mileageCode);
                            result.add(val.timeCode);
                            result.add(val.expenseCode);
                        })
                        result.remove(null);
                        sendResponse(res, null, {codes: result.toArray()});
                    }
                });
        })
}

/**
 * Create one by copying user profile default if one is not present
 */
function checkAndGetBillingProfileForClaimREST(req, res) {
    assert.ok(req.params.claimId, 'Expecting claimId as a parameter');
    assert.ok(req.headers.userid, 'Expecting userid in header');

    let claimId = req.params.claimId;
    let userId = req.headers.userid;
    let group = req.headers.group;
    let ingroups = req.headers.ingroups;

    // Check if profile exists
    mongoUtils.getEntityById(claimId, BILLING_PROFILE_COL_NAME, userId, ingroups)
        .then(function (err, profile) {
            _.isObject(profile)
                ? sendResponse(res, null, profile)
                : copyDefaultProfile();
        });

    // If not make a copy of the default profile
    function copyDefaultProfile() {
        mongoUtils.getEntityById(DEFAULT_USER, USERPROFILE_COL_NAME, DEFAULT_USER, [DEFAULT_USER])

            .then(function copyDefaultProfile(err, defaultProfile) {
                console.log('Creating new billing profile for claim: ' + userId);
                if (err) {
                    sendResponse(res, 'Error while setting up billing profile: ' + err.message, null);
                    return;
                }
                let newProfile = new BillingProfile();
                newProfile._id = claimId;
                newProfile.owner = userId;
                newProfile.group = group;
                newProfile.timeUnit = defaultProfile.billingProfile.timeUnit; // e.g., .1 hour.
                newProfile.distanceUnit = defaultProfile.billingProfile.distanceUnit;
                newProfile.timeRate = Number(defaultProfile.billingProfile.timeRate); // $ per unit.
                newProfile.distanceRate = Number(defaultProfile.billingProfile.distanceRate);
                newProfile.taxRate = Number(defaultProfile.billingProfile.taxRate);

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
exports.codesInUse = codesInUse;