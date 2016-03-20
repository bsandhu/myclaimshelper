var Claim = require('./../model/claim.js');
var Contact = require('./../model/contact.js');
var ClaimEntry = require('./../model/claimEntry.js');
var BillingItem = require('./../model/billingItem.js');
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

    // Invoke Contact service to update the Contact object
    function setReferenceToContactObj(contactJSON, callBack) {
        var defer = jQuery.Deferred();
        var contactObj = _.extend(new Contact(), contactJSON);

        if (_.isEmpty(contactObj.name)) {
            console.log('No ' + contactJSON + ' set. Skip setting Mongo reference');
            defer.reject();
            return;
        }
        contactObj.owner = req.headers.userid;
        contactService
            .saveOrUpdateContactObject(contactObj)
            .always(function (result) {
                if (result.status.toLowerCase() === 'success') {
                    defer.resolve(result.data._id);
                } else {
                    console.log('Error saving contact ref object for ' + contactJSON);
                    defer.reject();
                }
            });

        var chainedDefer = jQuery.Deferred();
        defer.done(function (contactId) {
            callBack(contactId);
            chainedDefer.resolve();
        });
        return chainedDefer;
    }

    // Update related claim entries
    function updateClaimEntryClosedStatus(claimId, newStatus){
        return mongoUtils.modifyAttr(
            mongoUtils.CLAIM_ENTRIES_COL_NAME,
            {isClosed: newStatus},
            {claimId: claimId});
    }

    var claim = req.body;
    claim = _.extend(new Claim(), claim);

    // Aggregate contact update calls
    var contactUpdateRequests = [];
    contactUpdateRequests.push(
        setReferenceToContactObj(claim.insuredContact, function (contactId) {
            claim.insuredContactId = contactId;
        }),
        setReferenceToContactObj(claim.insuredAttorneyContact, function (contactId) {
            claim.insuredAttorneyContactId = contactId;
        }),
        setReferenceToContactObj(claim.claimantContact, function (contactId) {
            claim.claimantContactId = contactId;
        }),
        setReferenceToContactObj(claim.claimantsAttorneyContact, function (contactId) {
            claim.claimantsAttorneyContactId = contactId;
        }),
        setReferenceToContactObj(claim.insuranceCoContact, function (contactId) {
            claim.insuranceCoContactId = contactId;
        })
    );
    _.each(claim.otherContacts, function (contactJSON, index) {
        setReferenceToContactObj(contactJSON, function (contactId) {
            claim.otherContactIds[index] = contactId;
        });
    });
    // Update related entries for existing claim
    if (claim._id) {
        contactUpdateRequests.push(updateClaimEntryClosedStatus(claim._id, claim.isClosed));
    }

    jQuery.when.apply(jQuery, contactUpdateRequests)
        .then(function () {
            delete claim.insuredContact;
            delete claim.insuredAttorneyContact;
            delete claim.claimantContact;
            delete claim.claimantsAttorneyContact;
            delete claim.insuranceCoContact;
            delete claim.otherContacts;
            claim.owner = req.headers.userid;

            mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME)
                .always(function (err, results) {
                    sendResponse(res, err, results);
                });
        });
}

function saveOrUpdateClaimEntry(req, res) {
    var entity = req.body;
    entity.owner = req.headers.userid;
    var description = entity.description;
    var billingItem = entity.billingItem;

    // Persisted separately
    delete entity.billingItem;

    // Added by the search
    delete entity.claimFileNumber;
    // Added to track locking
    delete entity.isClosed;

    entityExtractionService.extractEntities(description)
        .then(function (people) {
            for (var i = 0; i < people.length; i++) {
                description = description.replace(people[i], '<b>$&</b>');
            }
            entity.description = description;
        })
        .then(function () {
            // Save Claim Entry
            mongoUtils.saveOrUpdateEntity(entity, mongoUtils.CLAIM_ENTRIES_COL_NAME)
                .then(function (err, results) {

                    // Save BillingItem
                    if (billingItem && !err) {
                        billingItem.claimEntryId = results._id;
                        billingItem.claimEntryId
                        billingItem.owner = req.headers.userid;
                        // Ensure numeric values
                        billingItem.mileage = Number(billingItem.mileage || 0)
                        billingItem.time = Number(billingItem.time || 0)
                        billingItem.expenseAmount = Number(billingItem.expenseAmount || 0)
                        billingItem.totalAmount = Number(billingItem.totalAmount || 0)

                        mongoUtils.saveOrUpdateEntity(billingItem, mongoUtils.BILLING_ITEMS_COL_NAME)
                            .always(function (itemErr, itemResults) {
                                assert.ok(itemResults._id);
                                results.billingItem = itemResults;
                                sendResponse(res, itemErr, results);
                            });
                    } else {
                        sendResponse(res, err, results);
                    }
                });
        })
}

function modifyClaimEntry(req, res) {
    mongoUtils.modifyEntityAttr(req.body._id, mongoUtils.CLAIM_ENTRIES_COL_NAME, req.body.attrsAsJson)
        .always(function (err, results) {
            sendResponse(res, err, results);
        });
}

function modifyClaim(req, res) {
    mongoUtils.modifyEntityAttr(req.body._id, mongoUtils.CLAIMS_COL_NAME, req.body.attrsAsJson)
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

function populateContactRef(entityId, contactId, callback) {
    var defer = jQuery.Deferred();
    contactService.getContactObject(contactId, entityId)
        .done(function (result) {
            var contactObj = result.status.toLowerCase() === 'success' ? result.data : new Contact();
            defer.resolve(contactObj);
        });

    var chainedDefer = jQuery.Deferred();
    defer.done(function (contactObj) {
        callback(contactObj);
        chainedDefer.resolve();
    });
    return chainedDefer;
}

function getClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    var entityId = req.params.id;
    var owner = req.headers.userid;

    mongoUtils.getEntityById(entityId, mongoUtils.CLAIMS_COL_NAME, owner)
        .always(function (err, results) {
            if (err) {
                sendResponse(res, err, results);
            } else {
                var claim = results;
                claim.otherContactIds = claim.otherContactIds || [];
                claim.otherContacts = claim.otherContacts || [];

                // Create Dynamic callbacks for saving all the contact objects
                var requests = [];
                requests.push(
                    populateContactRef(owner, claim.insuredContactId, function (contactObj) {
                        claim.insuredContact = contactObj;
                    }),
                    populateContactRef(owner, claim.insuredAttorneyContactId, function (contactObj) {
                        claim.insuredAttorneyContact = contactObj;
                    }),
                    populateContactRef(owner, claim.claimantContactId, function (contactObj) {
                        claim.claimantContact = contactObj;
                    }),
                    populateContactRef(owner, claim.claimantsAttorneyContactId, function (contactObj) {
                        claim.claimantsAttorneyContact = contactObj;
                    }),
                    populateContactRef(owner, claim.insuranceCoContactId, function (contactObj) {
                        claim.insuranceCoContact = contactObj;
                    })
                );

                _.each(claim.otherContactIds, function (contactId, index) {
                    requests.push(
                        populateContactRef(contactId, function (contactObj) {
                            if (!Boolean(contactObj) || _.isEmpty(contactObj)) {
                                console.warn("Could not populate Contact for Id: " + contactId);
                            }
                            claim.otherContacts[index] = contactObj;
                        })
                    );
                });

                // Call When the Deferreds array
                jQuery.when.apply(jQuery, requests)
                    .done(function () {
                        sendResponse(res, err, results);
                    });
            }
        });
}

function getAllClaims(req, res) {
    console.log('Get all Claims');

    mongoUtils.run(function (db) {
        claimsCollection(db).find({owner: req.headers.userid}).toArray(onResults);

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
    var query = req.body.query;
    var owner = req.headers.userid;
    query.owner = owner;

    console.log('Searching for Claim with query: ' + query);
    mongoUtils.run(function (db) {
        claimsCollection(db).find(query).toArray(onResults);

        function onResults(err, claims) {
            if (err || claims.length == 0) {
                console.log('Error: ' + err);
                sendResponse(res, err, []);
            } else if (claims.length == 0) {
                console.log('No claims match this search ' + query);
                sendResponse(res, err, []);
            } else {
                // Aggregate the contactLookups for the contact details
                var contactLookups = [];
                _.each(claims, function(claim){
                    contactLookups.push(
                        populateContactRef(owner, claim.insuredContactId, function (contactObj) {
                            claim.insuredContact = contactObj;
                        }),
                        populateContactRef(owner, claim.claimantContactId, function (contactObj) {
                            claim.claimantContact = contactObj;
                        })
                    );
                });

                jQuery.when.apply(jQuery, contactLookups)
                    .done(function () {
                        sendResponse(res, err, claims);
                    });
            }
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
    query.owner = req.headers.userid;

    var options = req.body.options || {};

    console.log('Searching for ClaimEntries. Req: ' + JSON.stringify(req.body));
    mongoUtils.run(function (db) {
        claimEntriesCollection(db)
            .find(query, options)
            .toArray(onResults);

        function populateClaimFileNumber(item) {
            var defer = jQuery.Deferred();
            mongoUtils
                .findEntities(mongoUtils.CLAIMS_COL_NAME, {_id: item.claimId, owner: req.headers.userid}, db)
                .then(function (claims) {
                    // ClaimEntry has only one Claim
                    var claim = _.first(claims);
                    if (claim) {
                        item.claimFileNumber = claim.insuranceCompanyFileNum || 'None';
                        item.isClosed = claim.isClosed || false;
                    }
                    defer.resolve();
                })
            return defer;
        }

        function populateBillingItem(item) {
            var defer = jQuery.Deferred();
            mongoUtils
                .findEntities(mongoUtils.BILLING_ITEMS_COL_NAME, {claimEntryId: item._id, owner: req.headers.userid}, db)
                .then(function (billingItems) {
                    // ClaimEntry has only one BilingItem
                    var billingItem = _.first(billingItems);
                    if (billingItem) {
                        item.billingItem = mongoUtils.hydrate(BillingItem, billingItem)[0];
                    }
                    defer.resolve();
                })
            return defer;
        }

        function onResults(err, items) {
            var defereds = [];
            _.each(items, function (item) {
                defereds.push(populateBillingItem(item));
                defereds.push(populateClaimFileNumber(item));
            });
            jQuery.when.apply(jQuery, defereds)
                .then(function () {
                    var modelObjs = _.map(items, convertToModel);
                    sendResponse(res, err, modelObjs);
                })
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
        console.info('Success response: ' + JSON.stringify(jsonData).substr(0, 100));
        res.json({'status': 'Success', 'data': jsonData});
    }
}


exports.saveOrUpdateClaim = saveOrUpdateClaim;
exports.saveOrUpdateClaimEntry = saveOrUpdateClaimEntry;
exports.modifyClaimEntry = modifyClaimEntry;
exports.modifyClaim = modifyClaim;
exports.saveOrUpdateClaimEntryObject = saveOrUpdateClaimEntryObject;
exports.getClaim = getClaim;
exports.getClaimEntry = getClaimEntry;
exports.getAllClaims = getAllClaims;
exports.getAllEntriesForClaim = getAllEntriesForClaim;
exports.deleteClaim = deleteClaim;
exports.searchClaims = searchClaims;
exports.searchClaimEntries = searchClaimEntries;
exports.sendResponse = sendResponse;
