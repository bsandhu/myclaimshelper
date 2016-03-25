var assert = require('assert');
var billingProfileService = require('./../../server/services/billingProfileService.js');
var BillingProfile = require('./../../server/model/billingProfile.js');
var mongoUtils = require("./../../server/mongoUtils.js");
var _ = require('underscore');
var jQuery = require('jquery-deferred');
var BILLING_PROFILE_COL_NAME = mongoUtils.BILLING_PROFILE_COL_NAME;


describe('BillingProfile Service', function () {

    after(function(done) {
        jQuery.when(_.partial(mongoUtils.deleteEntity, {_id: "TestClaim"}, mongoUtils.BILLING_PROFILE_COL_NAME)())
            .done(done)
            .fail('Failed to cleanup test data');
    });

    var testBillingProfile = undefined;

    it('checkAndGetBillingProfileForClaimREST', function (done) {
        var req = {params: {claimId: 'TestClaim'}, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data._id, 'TestClaim');
            assert.equal(data.data.owner, 'TestUser');
            assert.equal(data.data.distanceRate, 0.3);
            assert.equal(data.data.distanceUnit, 'mile');

            testBillingProfile = data.data;
            done();
        };
        billingProfileService.checkAndGetBillingProfileForClaimREST(req, res);
    });

    it('saveOrUpdateREST', function (done) {
        var req = {body: testBillingProfile, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data._id, 'TestClaim');
            assert.equal(data.data.owner, 'TestUser');
            // Updated value
            assert.equal(data.data.distanceRate, 0.55);
            assert.equal(data.data.distanceUnit, 'mile');
            done();
        };
        testBillingProfile.distanceRate = 0.55;
        billingProfileService.saveOrUpdateREST(req, res);
    });

    it('checkAndGetBillingProfileForClaimREST already exists', function (done) {
        var req = {params: {claimId: 'TestClaim'}, headers: {userid: 'TestUser'}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.distanceRate, 0.55);
            done();
        };
        billingProfileService.checkAndGetBillingProfileForClaimREST(req, res);
    });
});
