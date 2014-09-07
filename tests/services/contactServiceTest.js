var assert = require('assert');
var contactService = require('./../../server/services/contactService.js');
var Contact = require('./../../server/model/contact.js');

describe('Contact Service', function () {
    var testContact = new Contact();
    testContact.name = 'Test Contact' + new Date().getTime();
    testContact.job = 'Test Job';
    testContact.company = 'Test Company';
    testContact.email = 'Test Email';
    testContact.phone = 'Test Phone';
    testContact.cell = 'Test Cell';

    after(function(done) {
        assert.ok(testContact._id);
        contactService
            .deleteContact(testContact._id)
            .done(done)
            .fail('Failed to cleanup test data');
    });

    it('Add Contact', function (done) {
        var req = {body: testContact};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testContact._id);
            done();
        };
        contactService.saveOrUpdateContactObject(testContact).
            then(function (data) {
                assert(data);
                assert.equal(data.status, 'Success');

                var contact = data.data;
                assert.ok(contact._id);
                assert.equal(contact.job, 'Test Job');
                done();
            });
    });

    it('List All Contacts', function (done) {
        var req = {};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert(data.data.length >= 1);
            done();
        };
        contactService.listAllContacts(req, res);
    });

});
