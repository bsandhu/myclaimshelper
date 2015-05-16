var mongoUtils = require('./../../server/mongoUtils.js');
var _ = require('underscore');
var jQuery = require('jquery-deferred');

var testContacts = require('./testContacts.js');
var testClaimEntries = require('./testClaimEntries.js');
var testClaims = require('./testClaims.js');


function nukeDB(){
    console.log('NUKING DB');
    var defer = jQuery.Deferred();
    jQuery.when(
        mongoUtils.deleteEntity({}, mongoUtils.CONTACTS_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.CLAIM_ENTRIES_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.CLAIMS_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.BILL_COL_NAME),
        mongoUtils.deleteEntity({}, mongoUtils.BILLING_ITEMS_COL_NAME))
        .then(function(){
            defer.resolve();
            console.log('FINISHED NUKING DB');
        });
    return defer;
}

function populateDB(){

    // Contacts
    _.each(testContacts.data, function(contact){
        mongoUtils.saveOrUpdateEntity(contact, mongoUtils.CONTACTS_COL_NAME)
            .always(function (err) {
                console.info(!err ? 'Saved contact' : err);
            });
    });

    // ClaimEntries
    _.each(testClaimEntries.data, function(entry){
        mongoUtils.saveOrUpdateEntity(entry, mongoUtils.CLAIM_ENTRIES_COL_NAME)
            .always(function (err) {
                console.info(!err ? 'Saved ClaimEntry' : err);
            });
    });

    // Claims
    _.each(testClaims.data, function(claim){
        mongoUtils.saveOrUpdateEntity(claim, mongoUtils.CLAIMS_COL_NAME)
            .always(function (err) {
                console.info(!err ? 'Saved Claim' : err);
            });
    });

}


// How to run?
// Uncomment the one you need and run from command line.
//   Example: ~/src/Agent/007> node tests/data/testDataLoader.js

//nukeDB();
//populateDB();