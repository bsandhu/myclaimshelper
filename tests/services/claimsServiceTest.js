var assert = require("assert");
var mongoUtils = require("./../../server/mongoUtils.js");
var claimsService = require("./../../server/services/claimsService.js");
var contactService = require('./../../server/services/contactService.js');
var Claim = require("./../../server/model/claim.js");
var Bill = require("./../../server/model/bill.js");
var BillingItem = require("./../../server/model/billingItem.js");
var BillingStatus = require("./../../server/model/billingStatus.js");
var ClaimEntry = require("./../../server/model/claimEntry.js");
var States = require("./../../server/model/states.js");
var jQuery = require('jquery-deferred');


describe('ClaimsService', function () {

    var testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";
    testClaim.state = 'open';
    testClaim.insuredContact = {name: 'TestFist', city: 'TestCity', zip: 11010};
    testClaim.insuranceCompanyFileNum = "123";

    var testBillingItem = new BillingItem();
    testBillingItem.description = 'Test billing item';
    testBillingItem.mileage = 100;
    testBillingItem.time = '20';

    var testEntry = new ClaimEntry();
    testEntry.entryDate = new Date(2014, 2, 1);
    testEntry.dueDate = new Date(2014, 2, 10);
    testEntry.summary = "I am test Task too";
    testEntry.state = 'open';
    testEntry.description = 'Bill has a hat. He is going to catch up with Elnora Ragan on wed morning.';
    testEntry.billingItem = testBillingItem;

    after(function (done) {
        assert.ok(testClaim._id);

        jQuery.when(
            claimsService.deleteClaim(testClaim._id),
            mongoUtils.deleteEntity({name: {$eq: "TestFist"}}, mongoUtils.CONTACTS_COL_NAME),
            mongoUtils.deleteEntity({_id: testBillingItem._id}, mongoUtils.BILLING_ITEMS_COL_NAME),
            mongoUtils.deleteEntity({_id: 'claimservice_bill_id'}, mongoUtils.BILL_COL_NAME))
            .done(done)
            .fail('Failed to cleanup test data');
    });

    it('Save claim', function (done) {
        var req = {body: testClaim, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var claim = data.data;
            assert.ok(claim._id);
            assert.ok(claim.owner);
            testClaim._id = claim._id;

            // Contact ref
            assert.ok(claim.insuredContactId);
            testClaim.insuredContactId = claim.insuredContactId;
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
        var req = {body: testEntry, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data._id);
            assert.ok(data.data.owner);
            assert.equal(data.data.description, '<b>Bill</b> has a hat. He is going to catch up with <b>Elnora Ragan</b> on wed morning.');

            assert.ok(data.data.billingItem._id, 'BillingItem should be saved and returned');
            assert.ok(data.data.billingItem.claimEntryId, 'BillingItem should hold ref to ClaimEntry');
            assert.equal(data.data.billingItem.mileage, 100);
            assert.equal(data.data.billingItem.time, 20);
            assert.ok(data.data.claimId);
            done();
        };
        claimsService.saveOrUpdateClaimEntry(req, res);
    });

    it('Modify claim entry', function (done) {
        testEntry.claimId = testClaim._id;
        var req = {body: {_id: testClaim._id, attrsAsJson: {state: States.Pending}}, headers: {userid: 'TestUser'}};
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
        testEntry.owner = "TestUser";

        claimsService
            .saveOrUpdateClaimEntryObject(testEntry)
            .done(function (data) {
                assert(data);
                assert.equal(data.status, 'Success');
                assert.equal(data.data.isClosed, false);
                assert.ok(data.data._id);
                done();
            });
    });

    it('Update claim - mark closed', function (done) {
        testClaim.description = 'Test claim update';
        testClaim.isClosed = true;

        // Mimic the input from the browser
        testClaim._id = testClaim._id.toString();
        var req = {body: testClaim, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testClaim._id);
            assert.ok(data.data.owner);
            assert.equal(testClaim.description, 'Test claim update');
            done();
        };
        claimsService.saveOrUpdateClaim(req, res, mongoUtils.CLAIMS_COL_NAME);
    });

    it('Get a Claim', function (done) {
        var req = {params: {id: testClaim._id}, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var savedClaim = data.data;
            assert.equal(savedClaim.description, 'Test claim update');

            var savedContact = savedClaim.insuredContact;
            assert.ok(savedContact._id);
            assert.equal(savedContact.name, 'TestFist');
            assert.equal(savedContact.zip, 11010);
            done();
        };
        claimsService.getClaim(req, res);
    });

    it('Get a Claim Entry', function (done) {
        var req = {params: {id: testEntry._id}, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var savedClaimEntry = data.data[0];
            assert.ok(savedClaimEntry.claimId);
            // Claim closed in previous step
            assert.equal(savedClaimEntry.isClosed, true);
            assert.equal(savedClaimEntry.summary, 'I am test Task too');
            assert.ok(savedClaimEntry.billingItem);
            assert.ok(savedClaimEntry.billingItem._id);
            assert.equal(savedClaimEntry.billingItem.mileage, 100);
            done();
        };
        claimsService.getClaimEntry(req, res);
    });

    it('Get all entries for a Claim', function (done) {
        var req = {params: {id: testClaim._id}, headers: {userid: 'TestUser'}};
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
        var req = {params: {id: testClaim._id}, headers: {userid: 'TestUser'}};
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

    it('Search through claims', function (done) {
        var req = {body: {query: {"state": "open"}}, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var claim = data.data[0];
            assert.equal(claim.state, testClaim.state);
            assert.ok(claim.claimantContact);
            assert.ok(claim.insuredContact);
            done();
        };
        claimsService.searchClaims(req, res);
    });

    it('Search through claim entries', function (done) {
        var req = {headers: {userid: 'TestUser'}};
        var res = {};
        req.body = {query: {"state": "open"},
            options: {"sort": ["state", "asc"]}};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var entry = data.data[0];
            assert.equal(entry.state, testClaim.state);
            assert.equal(entry.fileNum, 'None');
            assert.equal(entry.insuranceCoFileNum, testClaim.insuranceCoFileNum);
            done();
        };
        claimsService.searchClaimEntries(req, res);
    });

    it('Close claim with no bills', function (done) {
        var req = {headers: {userid: 'TestUser'}};
        var res = {};
        req.body = {claimId: testClaim._id, ignoreUnsubmittedBills: false};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.closeClaim(req, res);
    });

    it('Close claim with bills', function (done) {
        var req = {headers: {userid: 'TestUser'}};
        var res = {};
        req.body = {claimId: testClaim._id, ignoreUnsubmittedBills: false};

        var bill = new Bill();
        bill.claimId = testClaim._id;
        bill._id = 'claimservice_bill_id';
        bill.owner = 'TestUser';
        bill.status = BillingStatus.NOT_SUBMITTED;

        mongoUtils
            .saveOrUpdateEntity(bill, mongoUtils.BILL_COL_NAME, 'TestUser')
            .then(function () {
                claimsService.closeClaim(req, res);
            })

        res.json = function (data) {
            assert(data);
            assert.equal(data.Status, 'Fail');
            assert.equal(data.Details, 'Unsubmitted bills');
            done();
        };
    });

});
