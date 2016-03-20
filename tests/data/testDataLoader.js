var mongoUtils = require('./../../server/mongoUtils.js');
var _ = require('underscore');
var jQuery = require('jquery-deferred');

var testContacts = require('./testContacts.js');
var testClaimEntries = require('./testClaimEntries.js');
var testBililngItems = require('./testBIllingItems.js');
var testClaims = require('./testClaims.js');
var testUserProfile = require('./testUserProfile.js');

var TEST_USER_ID = 'testuser1';


function nukeDB() {
    console.log('NUKING DB');
    var defer = jQuery.Deferred();
    jQuery.when(
        mongoUtils.deleteEntity({}, mongoUtils.CONTACTS_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.CLAIM_ENTRIES_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.CLAIMS_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.BILL_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.BILLING_ITEMS_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.USERPROFILE_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.NOTIFICATIONS_COL_NAME))
        .then(function () {
            defer.resolve();
            console.log('FINISHED NUKING DB');
        });
    return defer;
}

function populateContacts() {
    _.each(testContacts.data, function (contact) {
        contact.owner = TEST_USER_ID;
        mongoUtils.saveOrUpdateEntity(contact, mongoUtils.CONTACTS_COL_NAME, TEST_USER_ID)
            .always(function (err) {
                console.info(!err ? 'Saved contact' : err);
            });
    });
}

function populateClaimEntries() {
    _.each(testClaimEntries.data, function (entry) {
        entry.owner = TEST_USER_ID;
        mongoUtils.saveOrUpdateEntity(entry, mongoUtils.CLAIM_ENTRIES_COL_NAME, TEST_USER_ID)
            .always(function (err) {
                console.info(!err ? 'Saved ClaimEntry' : err);
            });
    });
}

function populateBillingItems() {
    _.each(testBililngItems.data, function (entry) {
        entry.owner = TEST_USER_ID;
        mongoUtils.saveOrUpdateEntity(entry, mongoUtils.BILLING_ITEMS_COL_NAME, TEST_USER_ID)
            .always(function (err) {
                console.info(!err ? 'Saved BillingItem' : err);
            });
    });
}

function populateClaims() {
    _.each(testClaims.data, function (claim) {
        claim.owner = TEST_USER_ID;
        mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME, TEST_USER_ID)
            .always(function (err) {
                console.info(!err ? 'Saved Claim' : err);
            });
    });
}

function populateUserProfiles() {
    _.each(testUserProfile.data, function (data) {
        data.owner = "DefaultUser";
        mongoUtils.saveOrUpdateEntity(data, mongoUtils.USERPROFILE_COL_NAME, "DefaultUser")
            .always(function (err) {
                console.info(!err ? 'Saved UserProfile' : err);
            });
    });
}


// How to run?
// Uncomment the one you need and run from command line.
//   Example: ~/src/Agent/007> node tests/data/testDataLoader.js
// Run one fn at a time, in the order below

//nukeDB();
//populateUserProfiles();
//populateContacts()
//populateClaimEntries();
//populateBillingItems();
//populateClaims()
