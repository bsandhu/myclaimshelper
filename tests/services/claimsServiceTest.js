let assert = require("assert");
let mongoUtils = require("./../../server/mongoUtils.js");
let claimsService = require("./../../server/services/claimsService.js");
let contactService = require('./../../server/services/contactService.js');
let Claim = require("./../../server/model/claim.js");
let Contact = require("./../../server/model/contact.js");
let Bill = require("./../../server/model/bill.js");
let BillingItem = require("./../../server/model/billingItem.js");
let BillingStatus = require("./../../server/model/billingStatus.js");
let ClaimEntry = require("./../../server/model/claimEntry.js");
let States = require("./../../server/model/states.js");
let Consts = require("./../../server/shared/consts.js");
let jQuery = require('jquery-deferred');


describe('ClaimsService', function () {

    let testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";
    testClaim.state = 'open';
    testClaim.contacts = [{
        category: Consts.CONTACT_CATEGORY_OTHER,
        subCategory: 'TestSubCat',
        contact: {name: 'TestFist', city: 'TestCity', zip: 11010}
    }, {
        category: Consts.CONTACT_CATEGORY_INSURED,
        subCategory: Consts.CONTACT_SUBCATEGORY_INSURED,
        contact: {name: 'TestFist', city: 'TestCity', zip: 11010}
    }];
    testClaim.insuranceCompanyFileNum = "123";

    let testBillingItem = new BillingItem();
    testBillingItem.description = 'Test billing item';
    testBillingItem.mileage = 100;
    testBillingItem.time = '20';

    let testEntry = new ClaimEntry();
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
        let req = {body: testClaim, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: 'TestGroup'}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let claim = data.data;
            assert.ok(claim._id);
            assert.ok(claim.owner);
            testClaim._id = claim._id;
            testClaim.owner = claim.owner;
            testClaim.group = claim.group;

            // Contact ref
            assert.ok(claim.contacts[0].contactId);
            assert.ok(claim.contacts[0].category);
            assert.ok(claim.contacts[0].subCategory);
            assert.ok(!claim.contacts[0].hasOwnProperty('contact'));

            // Old schema not saved anymore
            assert.ok(!claim.hasOwnProperty('claimantContactId'));
            assert.ok(!claim.claimantContactId);

            assert.ok(!claim.hasOwnProperty('claimantsAttorneyContactId'));
            assert.ok(!claim.claimantsAttorneyContactId);
            done();
        };
        claimsService.saveOrUpdateClaim(req, res);
    });

    it('Save claim entry', function (done) {
        testEntry.claimId = testClaim._id;
        let req = {body: testEntry, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data._id);
            assert.ok(data.data.owner);
            assert.ok(data.data.group);
            assert.equal(data.data.description, '<b>Bill</b> has a hat. He is going to catch up with <b>Elnora Ragan</b> on wed morning.');

            assert.ok(data.data.billingItem._id, 'BillingItem should be saved and returned');
            assert.ok(data.data.billingItem.claimEntryId, 'BillingItem should hold ref to ClaimEntry');
            assert.equal(data.data.billingItem.mileage, 100);
            assert.equal(data.data.billingItem.time, 20);
            assert.ok(data.data.claimId);
            assert.equal(data.data.displayOrder, data.data._id);
            done();
        };
        claimsService.saveOrUpdateClaimEntry(req, res);
    });

    it('Modify claim entry', function (done) {
        testEntry.claimId = testClaim._id;
        let req = {
            body: {_id: testClaim._id, attrsAsJson: {state: States.Pending}},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: 'TestGroup'}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.modifyClaimEntry(req, res);
    });

    it('Save claim entry object', function (done) {
        let testEntry = new ClaimEntry();
        testEntry.entryDate = new Date(2014, 2, 1);
        testEntry.dueDate = new Date(2014, 2, 10);
        testEntry.summary = "I am test Task too";
        testEntry.owner = "TestUser";
        testEntry.group = "TestGroup";

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
        let req = {body: testClaim, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: 'TestGroup'}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testClaim._id);
            assert.ok(data.data.owner);
            assert.ok(data.data.group);
            assert.equal(testClaim.description, 'Test claim update');
            done();
        };
        claimsService.saveOrUpdateClaim(req, res, mongoUtils.CLAIMS_COL_NAME);
    });

    it('Get a Claim', function (done) {
        let req = {
            params: {id: testClaim._id},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let savedClaim = data.data;
            assert.equal(savedClaim.description, 'Test claim update');

            // Re-hydrate contacts
            assert.equal(savedClaim.contacts[0].category, 'Other');
            assert.equal(savedClaim.contacts[0].subCategory, 'TestSubCat');

            let savedContact = savedClaim.contacts[0].contact;
            assert.ok(savedContact._id);
            assert.equal(savedContact.name, 'TestFist');
            assert.equal(savedContact.zip, 11010);
            done();
        };
        claimsService.getClaim(req, res);
    });

    it('Get a Claim Entry', function (done) {
        let req = {
            params: {id: testEntry._id},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let savedClaimEntry = data.data[0];
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
        let req = {
            params: {id: testClaim._id},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let entries = data.data;
            assert.equal(entries.length, 1);
            assert.ok(entries[0] instanceof ClaimEntry);
            done();
        };
        claimsService.getAllEntriesForClaim(req, res);
    });

    it('Search through claims', function (done) {
        let req = {
            body: {query: {"state": "open"}},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let claim = data.data[0];
            assert.equal(claim.state, testClaim.state);

            // Claimant is an empty object
            assert.ok(claim.claimantContact);
            assert.equal(claim.claimantContact.name, undefined);

            // Insured is hydrated
            assert.ok(claim.insuredContact);
            assert.equal(claim.insuredContact.name, 'TestFist');
            assert.equal(claim.insuredContact.city, 'TestCity');
            done();
        };
        claimsService.searchClaims(req, res);
    });

    it('Search through claim entries', function (done) {
        let req = {headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        req.body = {
            query: {"state": "open"},
            options: {"sort": ["state", "asc"]}
        };

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let entry = data.data[0];
            assert.equal(entry.state, testClaim.state);
            assert.equal(entry.fileNum, '-');
            assert.equal(entry.insuranceCoFileNum, testClaim.insuranceCoFileNum);
            done();
        };
        claimsService.searchClaimEntries(req, res);
    });

    it('Search through claim entries - pick up contacts', function (done) {
        let req = {headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        req.body = {
            query: {"claimId": testClaim._id},
            options: {"sort": ["state", "asc"]}
        };

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let entry = data.data[0];
            assert.equal(entry.state, testClaim.state);
            assert.equal(entry.fileNum, '-');
            assert.equal(entry.insuranceCoFileNum, testClaim.insuranceCoFileNum);
            assert.ok(entry.insuredContact);
            assert.equal(entry.insuredContact.name, 'TestFist');
            done();
        };
        claimsService.searchClaimEntries(req, res);
    });

    it('Close claim with no bills', function (done) {
        let req = {headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        req.body = {claimId: testClaim._id, ignoreUnsubmittedBills: false};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.closeClaim(req, res);
    });

    it('Close claim with bills', function (done) {
        let req = {headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        req.body = {claimId: testClaim._id, ignoreUnsubmittedBills: false};

        let bill = new Bill();
        bill.claimId = testClaim._id;
        bill._id = 'claimservice_bill_id';
        bill.owner = 'TestUser';
        bill.group = 'TestGroup';
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
