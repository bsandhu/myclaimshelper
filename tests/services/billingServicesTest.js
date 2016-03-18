var assert = require("assert");
var billingServices = require("./../../server/services/billingServices.js");
var Bill = require("../../server/model/bill.js");
var Claim = require("../../server/model/claim.js");
var BillingItem = require("../../server/model/billingItem.js");
var jQuery = require('jquery-deferred');
var mongoUtils = require("./../../server/mongoUtils.js");

describe('billingServices', function () {

    var bill = new Bill();
    bill.claimId = 'claim_id';
    bill._id = 'bill_id';
    bill.description = 'Test bill';

    var bi_1 = new BillingItem('task_id');
    bi_1.billId = bill._id;
    var bi_2 = new BillingItem('task_id');
    bi_2.billId = bill._id;


    it('saveOrUpdateBillingItemsREST ok', function (done) {
        var req = {body: [
            {summary: 'bi_1'},
            {summary: 'bi_2'}
        ], headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            console.log('data.data: ' + data.data);
            done();
        };
        billingServices.saveOrUpdateBillingItemsREST(req, res);
    });

    it('saveOrUpdateBillingItemsREST single ok', function (done) {
        var req = {body: [bi_1], headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            assert.ok(data.data._id);
            assert.ok(data.data.status);
            assert.ok(data.data.billId);
            console.log('data.data: ' + data.data);
            done();
        };
        billingServices.saveOrUpdateBillingItemsREST(req, res);
    });

    it('saveOrUpdateBillREST ok', function (done) {
        var req = {body: bill, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        billingServices.saveOrUpdateBillREST(req, res);
    });

    it('getBillsREST ok', function (done) {
        var req = {
            body: {
                search: {_id: bill._id},
                includeClosedClaims: false
            },
            headers: {userid: 'TestUser'}
        };
        var res = {};
        res.json = function (data) {
            console.log('getBillsREST: ' + JSON.stringify(data));
            var bill = data.data[0];
            assert.equal(bill.description, 'Test bill');
            assert.equal(bill._id, 'bill_id');
            assert.equal(bill.claimId, 'claim_id');
            assert.equal(bill.claimDescription, 'None');
            assert.equal(bill.claimInsuranceCompanyName, 'None');
            assert.equal(bill.claimInsuranceCompanyFileNum, 'None');

            // billingItems included...
            assert.ok(bill.billingItems);
            assert.equal(bill.billingItems[0].billId, bill._id);
            done();
        };
        billingServices.getBillsREST(req, res);
    });

    if ('getBillingItemsREST ok', function (done) {
        var req = {params: {search: {claimEntryId: 'task_id'}}, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            console.log('*****************');
            console.log(data);
            var items = data.data;
            assert.ok(items);
            done();
        };
        billingServices.getBillingItemsREST(req, res);
    });
});
