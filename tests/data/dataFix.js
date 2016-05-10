var mongoUtils = require('./../../server/mongoUtils.js');
var _ = require('underscore');
var jQuery = require('jquery-deferred');

var testContacts = require('./testContacts.js');
var testClaimEntries = require('./testClaimEntries.js');
var testBililngItems = require('./testBIllingItems.js');
var testClaims = require('./testClaims.js');
var testUserProfile = require('./testUserProfile.js');

var TEST_USER_ID = 'testuser1';

function addDisplayOrderToClaimEntries() {
    mongoUtils.connect()
        .then(function (db) {

            mongoUtils.findEntities(mongoUtils.CLAIM_ENTRIES_COL_NAME, {}, db, false)
                .then(function (entries) {

                    var promises = [];
                    _.each(entries, function (entry) {
                        var oldDate = new Date(entry.dueDate);
                        var newDate = new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate());
                        console.log(entry._id, entry.owner, oldDate, newDate);

                        entry.dueDate = newDate.getTime();
                        entry.displayOrder = Number(entry._id);

                        promises.push(_.partial(mongoUtils.saveOrUpdateEntity, entry, mongoUtils.CLAIM_ENTRIES_COL_NAME, entry.owner));
                    });

                    function consumer(index) {
                       if (index < promises.length) {
                           promises[index]().then(function(){
                               consumer(index + 1);
                           });
                       } else {
                           console.log('Done');
                       }
                    }
                    consumer(0);
                });
        });
}

//addDisplayOrderToClaimEntries();
