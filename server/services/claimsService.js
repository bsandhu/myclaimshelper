let Claim = require('./../model/claim.js');
let Contact = require('./../model/contact.js');
let ClaimEntry = require('./../model/claimEntry.js');
let BillingItem = require('./../model/billingItem.js');
let BillingStatus = require('../model/billingStatus.js');
let Consts = require('../shared/consts.js');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let sendResponse = serviceUtils.sendResponse;
let contactService = require('./contactService.js');
let entityExtractionService = require('./entityExtractionService.js');

let jQuery = require('jquery-deferred');
let assert = require('assert');
let _ = require('underscore');
let addOwnerInfo = mongoUtils.addOwnerInfo;

/********************************************************/
/* Delete API                                      */
/********************************************************/

function deleteClaim(claimId) {
    let defer = jQuery.Deferred();

    jQuery.when(
        mongoUtils.deleteEntity({_id: claimId}, mongoUtils.CLAIMS_COL_NAME),
        mongoUtils.deleteEntity({claimId: claimId}, mongoUtils.CLAIM_ENTRIES_COL_NAME))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function deleteClaimEntryREST(req, res) {
    console.log('Delete ClaimEntry');
    let claimEntryId = req.body.claimEntryId;
    assert.ok(claimEntryId, 'Expecting claimEntryId in req body');

    jQuery.when(
        mongoUtils.deleteEntity({_id: claimEntryId}, mongoUtils.CLAIM_ENTRIES_COL_NAME),
        mongoUtils.deleteEntity({claimEntryId: claimEntryId}, mongoUtils.BILLING_ITEMS_COL_NAME))
        .then(function () {
            console.log('Deleted ClaimEntry ' + claimEntryId);
            sendResponse(res, null, {});
        })
        .fail(function (err) {
            sendResponse(res, err, {});
        });
}

/********************************************************/
/* Save/Update API                                      */
/********************************************************/

function saveOrUpdateClaim(req, res) {

    // Invoke Contact service to update the Contact object
    function setReferenceToContactObj(contactJSON, callBack) {
        let defer = jQuery.Deferred();
        let contactObj = _.extend(new Contact(), contactJSON);

        if (_.isEmpty(contactObj.name)) {
            console.log('No ' + contactJSON + ' set. Skip setting Mongo reference');
            defer.reject();
            return;
        }
        contactService
            .saveOrUpdateContactObject(addOwnerInfo(req, contactObj))
            .always(function (result) {
                if (result.status.toLowerCase() === 'success') {
                    defer.resolve(result.data._id);
                } else {
                    console.log('Error saving contact ref object for ' + contactJSON);
                    defer.reject();
                }
            });

        let chainedDefer = jQuery.Deferred();
        defer.done(function (contactId) {
            callBack(contactId);
            chainedDefer.resolve();
        });
        return chainedDefer;
    }

    // Update 'closed' status on related claim entries
    function updateClaimEntryClosedStatus(claimId, newStatus) {
        return mongoUtils.modifyAttr(
            mongoUtils.CLAIM_ENTRIES_COL_NAME,
            {isClosed: newStatus},
            {claimId: claimId});
    }

    let claim = req.body;
    claim = _.extend(new Claim(), claim);

    // Aggregate contact update calls
    let contactUpdateRequests = [];
    _.each(claim.contacts, function (contactJSON, index) {
        contactUpdateRequests.push(
            setReferenceToContactObj(contactJSON.contact, function (contactId) {
                delete claim.contacts[index].contact
                claim.contacts[index].contactId = contactId;
            }));
    });
    // Update related entries for existing claim
    if (claim._id) {
        contactUpdateRequests.push(updateClaimEntryClosedStatus(claim._id, claim.isClosed));
    }

    jQuery.when.apply(jQuery, contactUpdateRequests)
        .then(function () {
            claim.owner = req.headers.userid;
            claim.group = req.headers.group;

            mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME)
                .always(function (err, results) {
                    sendResponse(res, err, results);
                });
        });
}

function saveOrUpdateClaimEntry(req, res) {
    let entity = req.body;
    entity = addOwnerInfo(req, entity);
    let description = entity.description;
    let billingItem = entity.billingItem;

    // Persisted separately
    delete entity.billingItem;

    // Added by the searchClaimEntries fn
    delete entity.fileNum;
    delete entity.insuranceCompanyFileNum;
    delete entity.insuranceCompanyName;
    delete entity.claimantContact;
    delete entity.insuredContact;

    entityExtractionService.extractEntities(description)
        .then(function (people) {
            for (let i = 0; i < people.length; i++) {
                description = description.replace(people[i], '<b>$&</b>');
            }
            entity.description = description;
        })
        .then(function () {
            // Save Claim Entry
            mongoUtils.saveOrUpdateEntity(entity, mongoUtils.CLAIM_ENTRIES_COL_NAME)
                .then(function (err, results) {
                    let defer = jQuery.Deferred();

                    // Save BillingItem
                    if (billingItem && !err) {
                        billingItem.claimEntryId = results._id;
                        billingItem.claimEntryId
                        billingItem.owner = req.headers.userid;
                        billingItem.group = req.headers.group;
                        // Ensure numeric values
                        billingItem.mileage = Number(billingItem.mileage || 0)
                        billingItem.time = Number(billingItem.time || 0)
                        billingItem.expenseAmount = Number(billingItem.expenseAmount || 0)
                        billingItem.totalAmount = Number(billingItem.totalAmount || 0)

                        mongoUtils.saveOrUpdateEntity(billingItem, mongoUtils.BILLING_ITEMS_COL_NAME)
                            .always(function (itemErr, itemResults) {
                                assert.ok(itemResults._id);
                                results.billingItem = itemResults;
                                defer.resolve(itemErr, results);
                            });
                    } else {
                        defer.reject(err, results);
                    }
                    return defer;
                })
                .then(function (err, results) {
                    let defer = jQuery.Deferred();
                    if (!err) {
                        // Set display order to be same as _id
                        if (!Boolean(entity.displayOrder)) {
                            entity.displayOrder = Number(entity._id);

                            let billItem = results.billingItem;
                            delete results.billingItem;

                            mongoUtils.saveOrUpdateEntity(entity, mongoUtils.CLAIM_ENTRIES_COL_NAME)
                                .always(function (entryErr, itemResults) {
                                    results.billingItem = billItem;
                                    defer.resolve(entryErr, results);
                                });
                        } else {
                            defer.resolve(err, results);
                        }
                    } else {
                        defer.reject(err, results);
                    }
                    return defer;
                })
                .then(function (err, results) {
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

function modifyClaim(req, res) {
    mongoUtils.modifyEntityAttr(req.body._id, mongoUtils.CLAIMS_COL_NAME, req.body.attrsAsJson)
        .always(function (err, results) {
            sendResponse(res, err, results);
        });
}

function closeClaim(req, res) {
    let search = {};
    let ignoreUnsubmittedBills = req.body.ignoreUnsubmittedBills;
    search = addOwnerInfo(req, search);
    search.claimId = req.body.claimId;
    search.status = BillingStatus.NOT_SUBMITTED;

    mongoUtils.connect()
        .then(function (db) {
            // Check un-submitted bills
            mongoUtils.findEntities(mongoUtils.BILL_COL_NAME, search, db)
                .then(function (bills) {
                    if (!ignoreUnsubmittedBills && bills.length > 0) {
                        res.json({'Status': 'Fail', 'Details': 'Unsubmitted bills'});
                    } else {
                        // Update claim and related entries
                        jQuery.when()
                            .then(closeClaimEntry)
                            .then(closeClaim)
                            .always(function (err, results) {
                                sendResponse(res, err, results);
                            });
                    }
                })
        });

    function closeClaim() {
        return mongoUtils.modifyEntityAttr(
            search.claimId,
            mongoUtils.CLAIMS_COL_NAME,
            {isClosed: true, dateClosed: new Date().getTime()});
    }

    function closeClaimEntry() {
        return mongoUtils.modifyAttr(
            mongoUtils.CLAIM_ENTRIES_COL_NAME,
            {isClosed: true},
            {claimId: search.claimId});
    }
}

/**
 * @param claimEntry model Object
 * @returns Deferred for the JSON response
 * @See claimsServiceTest#Save claim entry object for usage
 */
function saveOrUpdateClaimEntryObject(claimEntry) {
    assert.ok(claimEntry instanceof ClaimEntry, 'Expecting instance of ClaimEntry object');

    let defer = jQuery.Deferred();
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

function populateContactRef(owner, ingroups, contactId, callback) {
    let defer = jQuery.Deferred();
    contactService.getContactObject(contactId, owner, ingroups)
        .done(function (result) {
            let contactObj = result.status.toLowerCase() === 'success' ? result.data : new Contact();
            defer.resolve(contactObj);
        });

    let chainedDefer = jQuery.Deferred();
    defer.done(function (contactObj) {
        callback(contactObj);
        chainedDefer.resolve();
    });
    return chainedDefer;
}

function getClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    let entityId = req.params.id;
    let owner = req.headers.userid;
    let ingroups = req.headers.ingroups;

    function sanityCheck() {

    };

    mongoUtils.getEntityById(entityId, mongoUtils.CLAIMS_COL_NAME, owner, ingroups)
        .always(function (err, results) {
            if (err) {
                sendResponse(res, err, results);
            } else {
                let claim = results;
                let sanityCheckPass = true;
                claim.contacts = claim.contacts || [];

                // Create Dynamic callbacks for saving all the contact objects
                let requests = [];
                _.each(claim.contacts, function (contactInfo, index) {
                    requests.push(
                        populateContactRef(owner, ingroups, contactInfo.contactId, function (contactObj) {
                            if (!Boolean(contactObj) || _.isEmpty(contactObj)) {
                                console.warn("Could not populate Contact for Id: " + contactId);
                            }
                            claim.contacts[index].contact = contactObj;
                        })
                    );
                });

                // Sanity check
                for (let contactInfo of claim.contacts) {
                    if (_.isEmpty(contactInfo.category) || _.isEmpty(contactInfo.subCategory) || _.isEmpty(contactInfo.contactId)) {
                        sanityCheckPass = false;
                        sendResponse(res, 'Sanity check fail for: ' + JSON.stringify(contactInfo));
                        break;
                    }
                }

                // Call When the Deferreds array
                if (sanityCheckPass) {
                    jQuery.when.apply(jQuery, requests)
                        .done(function () {
                            sendResponse(res, err, results);
                        });
                }
            }
        });
}

/**
 * Pick first insured and claimant from Claim contacts
 */
function getInsuredAndClaimant(claim) {
    let isInsured = con => con.category == Consts.CONTACT_CATEGORY_INSURED && con.subCategory == Consts.CONTACT_SUBCATEGORY_INSURED;
    let insured = claim.contacts.find(isInsured);
    let insuredContactId = _.isObject(insured) && _.has(insured, 'contactId') ? insured.contactId : undefined;

    let isClaimant = con => con.category == Consts.CONTACT_CATEGORY_CLAIMANT && con.subCategory == Consts.CONTACT_SUBCATEGORY_CLAIMANT;
    let claimant = claim.contacts.find(isClaimant);
    let claimantContactId = _.isObject(claimant) && _.has(claimant, 'contactId') ? claimant.contactId : undefined;
    return {insuredContactId, claimantContactId};
}

function searchClaims(req, res) {
    let query = req.body.query;
    query = addOwnerInfo(req, query);

    console.log('Searching for Claim with query: ' + query);
    mongoUtils.run(function (db) {
        mongoUtils
            .findEntities(mongoUtils.CLAIMS_COL_NAME, query, db)
            .then(onResults)
            .fail(err => sendResponse(res, err, []));

        function onResults(claims) {
            // Aggregate the contactLookups for the contact details
            let contactLookups = [];
            _.each(claims, function (claim) {
                let {insuredContactId, claimantContactId} = getInsuredAndClaimant(claim);

                contactLookups.push(
                    populateContactRef(query.owner, query.ingroups, insuredContactId, function (contactObj) {
                        claim.insuredContact = contactObj;
                    }),
                    populateContactRef(query.owner, query.ingroups, claimantContactId, function (contactObj) {
                        claim.claimantContact = contactObj;
                    })
                );
            });

            jQuery.when.apply(jQuery, contactLookups)
                .done(function () {
                    sendResponse(res, null, claims);
                });
        }
    });
}

/********************************************************/
/* ClaimEntry - Read API                                */
/********************************************************/

function getClaimEntry(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimEntryId as a parameter');
    let entityId = req.params.id;

    req.body = req.body || {};
    req.body.query = {'_id': entityId};
    searchClaimEntries(req, res);
}

function getAllEntriesForClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    let claimId = req.params.id;
    console.log('Get all entries for Claim: ' + claimId);

    req.body = req.body || {};
    req.body.query = {'claimId': claimId};
    searchClaimEntries(req, res);
}

function searchClaimEntries(req, res) {
    let query = req.body.query;
    query = addOwnerInfo(req, query);

    let options = req.body.options || {};

    console.log('Searching for ClaimEntries. Req: ' + JSON.stringify(req.body));
    mongoUtils.run(function (db) {
        mongoUtils
            .findEntities(mongoUtils.CLAIM_ENTRIES_COL_NAME, query, db)
            .then(onResults)
            .fail(err => sendResponse(res, err));

        function onResults(items) {
            let defereds = [];
            _.each(items, function (item) {
                defereds.push(populateBillingItem(item));
                defereds.push(populateClaimFileNumber(item));
            });
            jQuery.when.apply(jQuery, defereds)
                .then(function () {
                    let modelObjs = _.map(items, convertToModel);
                    sendResponse(res, null, modelObjs);
                })
        }

        function convertToModel(item) {
            return _.extend(new ClaimEntry(), item);
        }

        // Helper functions to populate Claima and BillingItem attributes

        function populateContact(contactId) {
            let defer = jQuery.Deferred();
            if (contactId == null || contactId === undefined) {
                defer.resolve(new Contact());
            } else {
                contactService.getContactObject(contactId, query.owner, query.ingroups)
                    .done(function (result) {
                        let contactObj = result.status.toLowerCase() === 'success' ? result.data : new Contact();
                        defer.resolve(contactObj);
                    });
            }
            return defer;
        }

        let claimsCache = {};

        function populateClaimFileNumber(claimEntry) {
            let defer = jQuery.Deferred();

            // Set defaults
            claimEntry.fileNum = '-';
            claimEntry.insuranceCompanyFileNum = '-';
            claimEntry.insuranceCompanyName = '-';
            claimEntry.insuredContact = new Contact();
            claimEntry.claimantContact = new Contact();

            // Try to get from cache
            let cacheEntry = claimsCache[claimEntry.claimId];
            if (cacheEntry != undefined) {
                claimEntry.fileNum = cacheEntry[0];
                claimEntry.insuranceCompanyFileNum = cacheEntry[1];
                claimEntry.insuredContact = cacheEntry[2];
                claimEntry.claimantContact = cacheEntry[3];
                defer.resolve();
                return defer;
            }

            // Get from DB
            mongoUtils
                .findEntities(
                    mongoUtils.CLAIMS_COL_NAME,
                    addOwnerInfo(req, {_id: claimEntry.claimId}),
                    db)
                .then(function (claims) {
                    // ClaimEntry has only one Claim
                    let claim = _.first(claims);
                    if (claim) {
                        // Note: remember to delete these on ClaimEntry save
                        claimEntry.fileNum = claim.fileNum || claimEntry.fileNum;
                        claimEntry.insuranceCompanyFileNum = claim.insuranceCompanyFileNum || claimEntry.insuranceCompanyFileNum;
                        claimEntry.insuranceCompanyName = claim.insuranceCompanyName || claimEntry.insuranceCompanyName;

                        let {insuredContactId, claimantContactId} = getInsuredAndClaimant(claim);

                        jQuery.when(
                            populateContact(insuredContactId),
                            populateContact(claimantContactId))
                            .then(function (insured, claimant) {
                                claimEntry.insuredContact = insured;
                                claimEntry.claimantContact = claimant;
                                // Cache
                                claimsCache[claimEntry.claimId] = [claimEntry.fileNum, claimEntry.insuranceCompanyFileNum, insured, claimant];
                                defer.resolve();
                            });
                    } else {
                        defer.resolve();
                    }
                });
            return defer;
        }

        function populateBillingItem(claimEntry) {
            let defer = jQuery.Deferred();
            mongoUtils
                .findEntities(mongoUtils.BILLING_ITEMS_COL_NAME,
                    addOwnerInfo(req, {claimEntryId: claimEntry._id}),
                    db)
                .then(function (billingItems) {
                    // ClaimEntry has only one BilingItem
                    let billingItem = _.first(billingItems);
                    if (billingItem) {
                        claimEntry.billingItem = mongoUtils.hydrate(BillingItem, billingItem)[0];
                    }
                    defer.resolve();
                })
            return defer;
        }
    });
}


exports.closeClaim = closeClaim;
exports.saveOrUpdateClaim = saveOrUpdateClaim;
exports.saveOrUpdateClaimEntry = saveOrUpdateClaimEntry;
exports.modifyClaimEntry = modifyClaimEntry;
exports.deleteClaimEntryREST = deleteClaimEntryREST;
exports.modifyClaim = modifyClaim;
exports.saveOrUpdateClaimEntryObject = saveOrUpdateClaimEntryObject;
exports.getClaim = getClaim;
exports.getClaimEntry = getClaimEntry;
exports.getAllEntriesForClaim = getAllEntriesForClaim;
exports.deleteClaim = deleteClaim;
exports.searchClaims = searchClaims;
exports.searchClaimEntries = searchClaimEntries;
exports.sendResponse = sendResponse;
