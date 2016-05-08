var _ = require('lodash');
var assert = require('assert');
var jQuery = require('jquery-deferred');
var ContactSyncService = require('./../../server/services/contactSyncService.js');
var Contact = require('./../../server/model/contact.js')


xdescribe('ContactSyncService', function () {

    // Generate this and plug in here for the test to run
    var TEST_TOKEN =  'ya29.CjHaAliONRx9-MCT7km3V1y-rrX3S4lrTwuLMPRlsrRW9q_6lDHe6qXhy1VaI95CYXcw';

    it('addContactToGoogleContacts', function (done) {
        ContactSyncService
            ._addContactToGoogle('bbreidenbach', TEST_TOKEN)
            .then(function (results){
                assert.equal(results.status, 'success');
                done();
            }, function err(msg){
                assert.ok(msg.status);
                done();
            })
    })
})