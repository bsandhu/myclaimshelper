var assert = require("assert");
var claimsService = require("./../server/claims/claimsService.js");
var models = require("./../server/models/models.js");

describe('Mongo Conn', function () {

    var testClaim = new models.Claim();
    testClaim.description = 'Test claim';
    testClaim._id = String(new Date().getTime());

    it('Should be able to save claim', function (done) {
        var req = {};
        req.body = testClaim;
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.saveClaim(req, res, 'Claims');
    });

    it('Should be able to save claim entry', function (done) {
        var claimEntry = new models.ClaimEntry();
        claimEntry.claimId = testClaim._id;
        claimEntry.description = 'Test claim';
        claimEntry.entryDate = new Date();

        var req = {};
        req.body = claimEntry;
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.saveClaimEntry(req, res, 'ClaimEntries');
    })

    it('Should be able query claim entries', function (done) {
        var req = {params: {}};
        req.params.id = testClaim._id;

        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data[0].claimId, testClaim._id);
            done();
        };

        claimsService.getEntries(req, res);
    });
});