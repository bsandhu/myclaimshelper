var Claim = require('./../model/claim.js');
var Contact = require('./../model/contact.js');
var ClaimEntry = require('./../model/claimEntry.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var contactService = require('./contactService.js');
var entityExtractionService = require('./entityExtractionService.js');

var jQuery = require('jquery-deferred');
var assert = require('assert');
var _ = require('underscore');


/********************************************************/
/* Delete API                                      */
/********************************************************/

function deleteClaim(claimId) {
    var defer = jQuery.Deferred();

    jQuery.when(
        mongoUtils.deleteEntity({_id: claimId}, mongoUtils.CLAIMS_COL_NAME),
        mongoUtils.deleteEntity({claimId: claimId}, 'ClaimEntries'))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

/********************************************************/
/* Save/Update API                                      */
/********************************************************/

function saveOrUpdateClaim(req, res) {

    function setReferenceToContactObj(contactAttrName) {
        var defer = jQuery.Deferred();
        var contactObj = _.extend(new Contact(), claim[contactAttrName]);
        delete claim[contactAttrName];

        if (_.isEmpty(contactObj.firstName) && _.isEmpty(contactObj.lastName)) {
            console.log('No ' + contactAttrName + 'set. Skip setting Mongo reference');
            defer.reject();
            return;
        }
        contactService
            .saveOrUpdateContactObject(contactObj)
            .always(function (result) {
                if (result.status.toLowerCase() === 'success') {
                    claim[ contactAttrName + 'Id'] = result.data._id;
                    defer.resolve();
                } else {
                    console.log('Error saving contact ref object for ' + contactAttrName);
                    defer.reject();
                }
            });
        return defer;
    }

    var claim = req.body;
    claim = _.extend(new Claim(), claim);

    jQuery.when(
        setReferenceToContactObj('insuredContact'),
        setReferenceToContactObj('insuredAttorneyContact'),
        setReferenceToContactObj('claimantContact'),
        setReferenceToContactObj('claimantsAttorneyContact'),
        setReferenceToContactObj('insuranceCoContact')
    ).then(function () {
            mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME)
                .always(function (err, results) {
                    sendResponse(res, err, results);
                });
        });
}

function saveOrUpdateClaimEntry(req, res) {
    var entity = req.body;
    var description = entity.description;

    entityExtractionService.extractEntities(description)
        .then(function (people) {
            for(var i=0; i<people.length; i++){
                description = description.replace(people[i],'<b>$&</b>');
            }
            entity.description = description;
        })
        .then(function () {
            mongoUtils.saveOrUpdateEntity(entity, mongoUtils.CLAIM_ENTRIES_COL_NAME)
                .always(function (err, results) {
                    sendResponse(res, err, results);
                });
        });
}

function modifyClaimEntry(req, res) {
    mongoUtils.modifyEntityAttr(req.body._id, mongoUtils.CLAIM_ENTRIES_COL_NAME, req.body.attrsAsJson)
        .always(function (err, results) {
            sendResponse(res, err, results);
        });
}

/**
 * @param claimEntry model Object
 * @returns Deferred for the JSON response
 * @See claimsServiceTest#Save claim entry object for usage
 */
function saveOrUpdateClaimEntryObject(claimEntry) {
    assert.ok(claimEntry instanceof ClaimEntry, 'Expecting instance of ClaimEntry object');

    var defer = jQuery.Deferred();
    mongoUtils.saveOrUpdateEntity(claimEntry, mongoUtils.CLAIM_ENTRIES_COL_NAME)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}

function claimsCollection(db) {
    return db.collection(mongoUtils.CLAIMS_COL_NAME);
}

function claimEntriesCollection(db) {
    return db.collection(mongoUtils.CLAIM_ENTRIES_COL_NAME);
}

/********************************************************/
/* Claims - Read API                                    */
/********************************************************/

function getClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    var entityId = req.params.id;

    function populateContactRef(claim, contactAttrName) {
        var defer = jQuery.Deferred();
        var contactId = claim[contactAttrName + 'Id'];

        contactService
            .getContactObject(contactId)
            .done(function (result) {
                var contactObj = result.status.toLowerCase() === 'success' ? result.data : new Contact();
                claim[contactAttrName] = contactObj;
                defer.resolve();
            });
        return defer;
    }

    mongoUtils.getEntityById(entityId, mongoUtils.CLAIMS_COL_NAME)
        .always(function (err, results) {
            if (err) {
                sendResponse(res, err, results);
            } else {
                var claim = results;
                jQuery.when(
                    populateContactRef(claim, 'insuredContact'),
                    populateContactRef(claim, 'insuredContact'),
                    populateContactRef(claim, 'insuredAttorneyContact'),
                    populateContactRef(claim, 'claimantContact'),
                    populateContactRef(claim, 'claimantsAttorneyContact'),
                    populateContactRef(claim, 'insuranceCoContact')
                ).then(function () {
                        sendResponse(res, err, results);
                    });
            }
        });
}

function getAllClaims(req, res) {
    console.log('Get all Claims');

    mongoUtils.run(function (db) {
        claimsCollection(db).find().toArray(onResults);

        function onResults(err, items) {
            var modelObjs = _.map(items, convertToModel);
            sendResponse(res, err, modelObjs);

        }

        function convertToModel(item) {
            return _.extend(new Claim(), item);
        }
    });
}

function searchClaims(req, res) {
    assert.ok(req.params.search, 'Expecting Search as a parameter');
    var search = req.params.search;
    var query = JSON.parse(search);

    console.log('Searching for Claim with query: ' + search);
    mongoUtils.run(function (db) {
        claimsCollection(db).find(query).toArray(onResults);

        function onResults(err, items) {
            var resData = (items.length === 0)
                ? 'No claims match this search ' + search
                : _.extend(new Claim(), items);
            sendResponse(res, err, resData);
        }
    });
}

/********************************************************/
/* ClaimEntry - Read API                                */
/********************************************************/

function getClaimEntry(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimEntryId as a parameter');
    var entityId = req.params.id;

    req.body = req.body || {};
    req.body.query = {'_id': entityId};
    searchClaimEntries(req, res);
}

function getAllEntriesForClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    var claimId = req.params.id;
    console.log('Get all entries for Claim: ' + claimId);

    req.body = req.body || {};
    req.body.query = {'claimId': claimId};
    searchClaimEntries(req, res);
}

function searchClaimEntries(req, res) {
    var query = req.body.query;
    var options = req.body.options || {};

    console.log('Searching for ClaimEntries. Req: ' + JSON.stringify(req.body));
    mongoUtils.run(function (db) {
        claimEntriesCollection(db)
            .find(query, options)
            .toArray(onResults);

        function onResults(err, items) {
            var modelObjs = _.map(items, convertToModel);
            sendResponse(res, err, modelObjs);
        }

        function convertToModel(item) {
            return _.extend(new ClaimEntry(), item);
        }
    });
}

/********************************************************/
/* Utils                                                */
/********************************************************/

function sendResponse(res, err, jsonData) {
    if (err) {
        console.error('Error: ' + err);
        res.json(500, {'Status': 'Fail', 'Details': err});
    } else {
        console.info('Success response: ' + JSON.stringify(jsonData));
        res.json({'status': 'Success', 'data': jsonData});
    }
}


exports.saveOrUpdateClaim = saveOrUpdateClaim;
exports.saveOrUpdateClaimEntry = saveOrUpdateClaimEntry;
exports.modifyClaimEntry = modifyClaimEntry;
exports.saveOrUpdateClaimEntryObject = saveOrUpdateClaimEntryObject;
exports.getClaim = getClaim;
exports.getClaimEntry = getClaimEntry;
exports.getAllClaims = getAllClaims;
exports.getAllEntriesForClaim = getAllEntriesForClaim;
exports.deleteClaim = deleteClaim;
exports.searchClaims = searchClaims;
exports.searchClaimEntries = searchClaimEntries;
