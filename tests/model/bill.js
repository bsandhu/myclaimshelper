var assert = require("assert");
var Bill = require("./../../server/model/bill.js");
var BillingItem = require("./../../server/model/billingItem.js");
var billingServices = require("./../../server/services/billingServices.js");
var config = require("./../../server/config.js");
var mongoUtils = require("./../../server/mongoUtils.js");
var _ = require('underscore');

mongoUtils.initConnPool();
var db = mongoUtils.dbConn;


describe('Bill', function () {
    var bill = new Bill();
    bill.claimId = 'abc';
    bill._id = 'bill_id';
    var bi_1 = new BillingItem('task_id');
    bi_1.billId = 'bill_id';
    bill.billingItems = [bi_1];

    it('claimId is good', function (done) {
        assert.equal(bill.claimId, 'abc');
        assert.ok(bill);
        done()
    });

    it('gets with billingItems', function (done) {
        var db = mongoUtils.connect(config.db);

        var test = function (ret) {
            console.log(ret);
            var bill = ret[0];
            assert.equal(bill._id, 'bill_id');
            assert.equal(bill.billingItems[0].billId, 'bill_id');
            done();
        };
        db.then(_.partial(billingServices.getBillObjects,
            {_id: 'bill_id', owner: 'TestUser'},
            false))
          .then(test);
    });
});
