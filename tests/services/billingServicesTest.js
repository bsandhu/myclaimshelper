var assert = require("assert");
var billingServices = require("./../../server/services/billingServices.js");
var Bill = require("../../server/model/bill.js");
var BillingItem = require("../../server/model/billingItem.js");
var jQuery = require('jquery-deferred');
var mongoUtils = require("./../../server/mongoUtils.js");

describe('Billing Web Service', function () {

    var bill = new Bill('claim_id');
    bill._id = 'bill_id';
    bill.description = 'Test bill';

    var bi_1 = new BillingItem('task_id');
    bi_1.billId = bill._id;
    bill.billingObjects = [bi_1];

    it('saves bill', function (done) {
        var req = {body: bill};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var res_bill = data.data;
            assert.ok(res_bill._id);
            bill._id = res_bill._id;
            done();
        };

        billingServices.saveOrUpdateBill(req, res);
    });

    //it('gets bill', function (done) {
        //var req = {params: {id : testBill._id}};
        //var res = {};

        //res.json = function (data) {
            //assert(data);
            //assert.equal(data.status, 'Success');

            //var bill = data.data[0];
            //assert.equal(bill.description, 'Test bill');
            //assert.deepEqual(bill.claimEntryIds, [123]);
            //done();
        //};
        //billingServices.getBill(req, res);
    //});

});
