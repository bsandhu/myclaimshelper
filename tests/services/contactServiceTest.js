let assert = require('assert');
let contactService = require('./../../server/services/contactService.js');
let Contact = require('./../../server/model/contact.js');

describe('ContactService', function () {
    let testContact = new Contact();
    testContact.name = 'Test Contact' + new Date().getTime();
    testContact.job = 'Test Job';
    testContact.company = 'Test Company';
    testContact.email = 'Test Email';
    testContact.phone = 'Test Phone';
    testContact.cell = 'Test Cell';
    testContact.owner = 'TestUser';
    testContact.group = 'TestGroup';

    after(function(done) {
        assert.ok(testContact._id);
        contactService
            .deleteContact(testContact._id)
            .done(done)
            .fail('Failed to cleanup test data');
    });

    it('Add Contact', function (done) {
        let req = {body: testContact, headers: {userid: 'TestUser', ingroups: ['TestGroup']}};
        let res = {};

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

                let contact = data.data;
                assert.ok(contact._id);
                assert.equal(contact.job, 'Test Job');
                done();
            });
    });

    it('List All Contacts', function (done) {
        let req = {headers: {userid: 'TestUser', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert(data.data.length >= 1);
            done();
        };
        contactService.listAllContacts(req, res);
    });

});
