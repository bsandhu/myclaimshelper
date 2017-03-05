let assert = require('assert');
let billingProfileService = require('./../../server/services/billingProfileService.js');
let BillingProfile = require('./../../server/model/billingProfile.js');
let mongoUtils = require("./../../server/mongoUtils.js");
let _ = require('underscore');
let jQuery = require('jquery-deferred');
let BILLING_PROFILE_COL_NAME = mongoUtils.BILLING_PROFILE_COL_NAME;


describe('BillingProfile Service', function () {

    after(function(done) {
        jQuery.when(_.partial(mongoUtils.deleteEntity, {_id: "TestClaim"}, mongoUtils.BILLING_PROFILE_COL_NAME)())
            .done(done)
            .fail('Failed to cleanup test data');
    });

    let testBillingProfile = undefined;

    it('checkAndGetBillingProfileForClaimREST', function (done) {
        let req = {params: {claimId: 'TestClaim'}, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};

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
        let req = {body: testBillingProfile, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data._id, 'TestClaim');
            assert.equal(data.data.owner, 'TestUser');
            // Updated value
            assert.equal(data.data.distanceRate, 0.55);
            assert.equal(data.data.taxRate, 5.25);
            assert.equal(data.data.distanceUnit, 'mile');
            done();
        };
        // Update
        testBillingProfile.distanceRate = 0.55;
        testBillingProfile.taxRate = '5.25';
        billingProfileService.saveOrUpdateREST(req, res);
    });

    it('checkAndGetBillingProfileForClaimREST already exists', function (done) {
        let req = {params: {claimId: 'TestClaim'}, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.distanceRate, 0.55);
            done();
        };
        billingProfileService.checkAndGetBillingProfileForClaimREST(req, res);
    });

    it('isCodeInUse', function (done) {
        let req = {params: {billingCode: '100'}, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data.codes);
            done();
        };
        billingProfileService.codesInUse(req, res);
    });
});
