let assert = require('assert');
let contactService = require('./../../server/services/contactService.js');
let Contact = require('./../../server/model/contact.js');
let jQuery = require('jquery-deferred');
let _ = require('underscore');


describe('GroupMembership', function () {
    let TEST_CONTACTS = [];

    after(function (done) {
        let deleteFnCalls = TEST_CONTACTS.map(c => contactService.deleteContact(c._id));
        jQuery.when(deleteFnCalls)
            .then(() => {
                done();
            })
            .fail('Failed to cleanup test data');
    });

    before(function setupContacts(done) {
        let _this = this;

        function addContact(contactObj) {
            let defer = jQuery.Deferred();
            contactService.saveOrUpdateContactObject(contactObj)
                .then(function (data) {
                    assert(data);
                    assert.equal(data.status, 'Success');
                    defer.resolve(data.data);
                });
            return defer;
        }

        function createTestContact(name, owner, group) {
            return _.extend(new Contact(), {name: name, owner: owner, group: group});
        }

        jQuery.when(
            addContact(createTestContact('GroupsTestContact1', 'GroupTestUser1', 'GroupTestGroup1')),
            addContact(createTestContact('GroupsTestContact2', 'GroupTestUser2', 'GroupTestGroup1')),
            addContact(createTestContact('GroupsTestContact3', 'GroupTestUser3', 'GroupTestGroup2')))
            .then((...contacts) => {
                TEST_CONTACTS = TEST_CONTACTS.concat(contacts);
                done();
            });

    })

    it('Filter contacts by owner', function (done) {
        let req = {headers: {userid: 'GroupTestUser1', ingroups: ['NonExistent']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.length, 1);
            done();
        };
        contactService.listAllContacts(req, res);
    });

    it('Filter contacts by group', function (done) {
        let req = {headers: {userid: 'NonExistent', ingroups: ['GroupTestGroup1']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.length, 2);
            done();
        };
        contactService.listAllContacts(req, res);
    });

});
