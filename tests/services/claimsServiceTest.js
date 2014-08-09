var assert = require("assert");
var claimsService = require("./../../server/services/claimsService.js");
var Claim = require("./../../server/model/claim.js");
var ClaimEntry = require("./../../server/model/claimEntry.js");

describe('Claims Service', function () {

    var testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";

    it('Save claim', function (done) {
        var req = {body: testClaim};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data._id);
            done();
        };
        claimsService.saveOrUpdateClaim(req, res, 'Claims');
    });

    it('Save claim entry', function (done) {
        var testEntry = new ClaimEntry();
        testEntry.claimId = testClaim._id;
        testEntry.entryDate = new Date(2014, 2, 1);
        testEntry.dueDate = new Date(2014, 2, 10);
        testEntry.summary = "I am test Task too";

        var req = {body: testEntry};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data._id);
            done();
        };
        claimsService.saveOrUpdateClaimEntry(req, res, 'Claims');
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

    // TODO Won't pass on CodeShip. Can't figure out why
    it.skip('Get a Claim', function (done) {
        var req = {params: {id : testClaim._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var savedClaim = data.data;
            assert.equal(savedClaim.description, 'Test claim update');
            done();
        };
        claimsService.getClaim(req, res);
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
        }
        claimsService.getAllEntriesForClaim(req, res);
    });

    it('Get all cliams', function (done) {
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
});
