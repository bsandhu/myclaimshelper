var _ = require('lodash');
var assert = require('assert');
var jQuery = require('jquery-deferred');
var ContactSyncService = require('./../../server/services/contactSyncService.js');
var GoogleContactsClient = require('./../../server/services/googleContactsClient.js').GoogleContactsClient;
var Contact = require('./../../server/model/contact.js')
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;


xdescribe('GoogleContactsClient', function () {

    // Generate this and plug in here for the test to run
    var TEST_TOKEN =  'ya29.CjHaAggeSU9aui3T6RLDK_sLZGGkiggSNG98nQG6eGI8SYpR05pJs0eyU0nEyQvp1g7N';

    var testGroup;
    var allContactsInTestGroup;
    var lib = new GoogleContactsClient(TEST_TOKEN);

    var contact = new Contact();
    contact._id = 101;
    contact.isBusiness = false;
    contact.role = undefined;
    contact.name = 'Test Contact II';
    contact.businessName = undefined;
    contact.streetAddress = undefined;
    contact.city = undefined;
    contact.zip = undefined;
    contact.email = 'testcontactII@myclaimshelper.com';
    contact.phone = '5165165166';
    contact.cell = undefined;

    it('Get auth url', function (done) {
        var req = {};
        var resp = {};
        resp.json = function (data) {
            assert.ok(data.url);
            done();
        };
        resp.end = function () {
        };
        ContactSyncService.getAuthUrl(req, resp);
    });

    it('CreateGroup', function (done) {
        lib.createGroup('MyClaimsHelperTest')
            .then(function (data) {
                assert.ok(data);
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('GetGroups', function (done) {
        lib.getGroups()
            .then(function (data) {
                assert.ok(_.isArray(data));
                assert.ok(data[0]['id']);
                assert.ok(data[0]['title']);
                testGroup = _.find(data, function (group) {
                    return group.title == 'MyClaimsHelperTest';
                })
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('Create contact in group', function (done) {
        lib.createContact([contact], testGroup.id)
            .then(function (data) {
                assert.ok(data);
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('Get all contacts in group', function (done) {
        lib.getContacts(testGroup.id)
            .then(function (data) {
                assert.ok(data);
                assert.ok(data[0].id);
                allContactsInTestGroup = data;
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('Delete all contacts in group', function (done) {
        lib.deleteContact(
            _.map(allContactsInTestGroup, function (contact) {
                return contact.id;
            }))
            .then(function () {
                assert.ok(true);
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('DeleteGroup', function (done) {
        lib.deleteGroup(testGroup.id)
            .then(function (data) {
                assert.equal(data, "");
                done();
            })
            .fail(function () {
                assert.ok(false);
                done();
            });
    });

    it('Create contact request', function () {
        assert.equal(
            lib.creationRequestBody(contact, 'testGroupId'),
            '<entry>' +
            '<batch:id>create</batch:id>' +
            '<batch:operation type="insert"/>' +
            '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/contact/2008#contact"/>' +
            '<gd:name><gd:fullName>Test Contact II</gd:fullName></gd:name>' +
            '<gd:email rel="http://schemas.google.com/g/2005#work" primary="true" address="testcontactII@myclaimshelper.com" displayName="Test Contact II"/>' +
            '<gd:phoneNumber rel="http://schemas.google.com/g/2005#work" primary="true">5165165166</gd:phoneNumber>' +
            '<gContact:groupMembershipInfo href="testGroupId"/>' +
            '</entry>');

        contact.streetAddress = '100 Hoover ave';
        assert.equal(
            lib.creationRequestBody(contact, 'testGroupId'),
            '<entry>' +
            '<batch:id>create</batch:id>' +
            '<batch:operation type="insert"/>' +
            '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/contact/2008#contact"/>' +
            '<gd:name><gd:fullName>Test Contact II</gd:fullName></gd:name>' +
            '<gd:email rel="http://schemas.google.com/g/2005#work" primary="true" address="testcontactII@myclaimshelper.com" displayName="Test Contact II"/>' +
            '<gd:phoneNumber rel="http://schemas.google.com/g/2005#work" primary="true">5165165166</gd:phoneNumber>' +
            '<gd:structuredPostalAddress rel ="http://schemas.google.com/g/2005#work" primary="true">' +
            '<gd:street>100 Hoover ave</gd:street>' +
            '<gd:city>Unknown</gd:city>' +
            '<gd:region>Unknown</gd:region>' +
            '<gd:postcode>Unknown</gd:postcode>' +
            '</gd:structuredPostalAddress><gContact:groupMembershipInfo href="testGroupId"/>' +
            '</entry>');
    });
});
