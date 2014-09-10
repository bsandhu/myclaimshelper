var assert = require("assert");
var claimsService = require("./../../server/services/claimsService.js");
var contactService = require('./../../server/services/contactService.js');
var Claim = require("./../../server/model/claim.js");
var ClaimEntry = require("./../../server/model/claimEntry.js");
var States= require("./../../server/model/states.js");
var jQuery = require('jquery-deferred');


describe('Claims Service', function () {

    var testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";
    testClaim.state = 'open';
    testClaim.insuredContact = {firstName: 'TestFist', lastName: 'TestLast',  city: 'TestCity', zip: 11010};

    var testEntry = new ClaimEntry();
    testEntry.entryDate = new Date(2014, 2, 1);
    testEntry.dueDate = new Date(2014, 2, 10);
    testEntry.summary = "I am test Task too";

    after(function(done) {
        assert.ok(testClaim._id);

        jQuery.when(
            claimsService.deleteClaim(testClaim._id),
            contactService.deleteContact(testClaim.insuredContactId)
                .done(done)
                .fail('Failed to cleanup test data'));
    });

    it('Save claim', function (done) {
        var req = {body: testClaim};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var claim = data.data;
            assert.ok(claim._id);
            testClaim._id = claim._id;

            // Contact ref
            assert.ok(claim.insuredContactId);
            assert.ok(!claim.hasOwnProperty('insuredContact'));

            // Saved with all model attributes even if no data is supplied
            assert.ok(claim.hasOwnProperty('claimantContactId'));
            assert.ok(!claim.claimantContactId);

            assert.ok(claim.hasOwnProperty('claimantsAttorneyContactId'));
            assert.ok(!claim.claimantsAttorneyContactId);
            done();
        };
        claimsService.saveOrUpdateClaim(req, res);
    });

    it('Save claim entry', function (done) {
        testEntry.claimId = testClaim._id;
        var req = {body: testEntry};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data._id);
            done();
        };
        claimsService.saveOrUpdateClaimEntry(req, res);
    });

    it('Modify claim entry', function (done) {
        testEntry.claimId = testClaim._id;
        var req = {body: {_id: testClaim._id, attrsAsJson: {state: States.Pending}}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.modifyClaimEntry(req, res);
    });

    it('Save claim entry object', function (done) {
        var testEntry = new ClaimEntry();
        testEntry.entryDate = new Date(2014, 2, 1);
        testEntry.dueDate = new Date(2014, 2, 10);
        testEntry.summary = "I am test Task too";

        claimsService
            .saveOrUpdateClaimEntryObject(testEntry)
            .done(function(data) {
                assert(data);
                assert.equal(data.status, 'Success');
                assert.ok(data.data._id);
                done();
            });
    });

    it('Update claim', function (done) {
        testClaim.description = 'Test claim update';

        // Mimic the input from the browser
        testClaim._id = testClaim._id.toString();
        var req = {body: testClaim};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testClaim._id);
            assert.equal(testClaim.description, 'Test claim update');
            done();
        };
        claimsService.saveOrUpdateClaim(req, res, 'Claims');
    });

    it('Get a Claim', function (done) {
        var req = {params: {id : testClaim._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var savedClaim = data.data;
            assert.equal(savedClaim.description, 'Test claim update');

            var savedContact = savedClaim.insuredContact;
            assert.ok(savedContact._id);
            assert.equal(savedContact.firstName, 'TestFist');
            assert.equal(savedContact.lastName, 'TestLast');
            assert.equal(savedContact.zip, 11010);
            done();
        };
        claimsService.getClaim(req, res);
    });

    it('Get a Claim Entry', function (done) {
        var req = {params: {id : testEntry._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var savedClaimEntry = data.data;
            assert.ok(savedClaimEntry.claimId);
            assert.equal(savedClaimEntry.summary, 'I am test Task too');
            done();
        };
        claimsService.getClaimEntry(req, res);
    });

    it('Get all entries for a Claim', function (done) {
        var req = {params: {id : testClaim._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var entries = data.data;
            assert.equal(entries.length, 1);
            assert.ok(entries[0] instanceof ClaimEntry);
            done();
        };
        claimsService.getAllEntriesForClaim(req, res);
    });

    it('Get all claims', function (done) {
        var req = {params: {id : testClaim._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert(data.data.length >= 1);
            var claim = data.data[0];
            assert.ok(claim instanceof Claim);
            done();
        };

        claimsService.getAllClaims(req, res);
    });

    it('Search through claims', function(done) {
        var req = {params: {search : '{"state":"open"}'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var claim = data.data[0];
            assert.equal(claim.state, testClaim.state);
            done();
        };
        claimsService.searchClaims(req, res);
    });

});
