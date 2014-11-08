var assert = require("assert");
var billingServices = require("./../../server/services/billingServices.js");
var Bill = require("../../server/model/bill.js");
var jQuery = require('jquery-deferred');
var mongoUtils = require("./../../server/mongoUtils.js");

describe('Billing Service', function () {

    var testBill = new Bill();
    testBill.description = 'Test bill';
    testBill.claimEntryIds = [123];

    it('Save bill', function (done) {
        var req = {body: testBill};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var bill = data.data;
            assert.ok(bill._id);
            testBill._id = bill._id;
            done();
        };

        billingServices.saveOrUpdateBill(req, res);
    });

    it('Get a Bill', function (done) {
        var req = {params: {id : testBill._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var bill = data.data[0];
            assert.equal(bill.description, 'Test bill');
            assert.deepEqual(bill.claimEntryIds, [123]);
            done();
        };
        billingServices.getBill(req, res);
    });

    it('Get all bills', function (done) {
        var req = {};//{params: {id : testClaim._id}};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert(data.data.length >= 1);
            var bill = data.data[0];
            assert.ok(bill instanceof Bill);
            done();
        };

        billingServices.getAllBills(req, res);
    });

});
