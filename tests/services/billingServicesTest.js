let assert = require("assert");
let billingServices = require("./../../server/services/billingServices.js");
let Bill = require("../../server/model/bill.js");
let Claim = require("../../server/model/claim.js");
let BillingItem = require("../../server/model/billingItem.js");
let jQuery = require('jquery-deferred');
let mongoUtils = require("./../../server/mongoUtils.js");

describe('billingServices', function () {

    let bill = new Bill();
    bill.claimId = 'claim_id';
    bill._id = 'bill_id';
    bill.description = 'Test bill';

    let bi_1 = new BillingItem('task_id');
    bi_1.billId = bill._id;
    let bi_2 = new BillingItem('task_id');
    bi_2.billId = bill._id;


    it('saveOrUpdateBillingItemsREST ok', function (done) {
        let req = {body: [
            {summary: 'bi_1'},
            {summary: 'bi_2'}
        ], headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
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
        let req = {body: [bi_1], headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
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
        let req = {body: bill, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        billingServices.saveOrUpdateBillREST(req, res);
    });

    it('getBillsREST ok', function (done) {
        let req = {
            body: {
                search: {_id: bill._id},
                includeClosedClaims: false
            },
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}
        };
        let res = {};
        res.json = function (data) {
            console.log('getBillsREST: ' + JSON.stringify(data));
            let bill = data.data[0];
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
        let req = {
            params: {search: {claimEntryId: 'task_id'}},
            headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            console.log('*****************');
            console.log(data);
            let items = data.data;
            assert.ok(items);
            done();
        };
        billingServices.getBillingItemsREST(req, res);
    });
});
