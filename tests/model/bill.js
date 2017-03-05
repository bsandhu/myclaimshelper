let assert = require("assert");
let Bill = require("./../../server/model/bill.js");
let BillingItem = require("./../../server/model/billingItem.js");
let billingServices = require("./../../server/services/billingServices.js");
let config = require("./../../server/config.js");
let mongoUtils = require("./../../server/mongoUtils.js");
let _ = require('underscore');

mongoUtils.initConnPool();
let db = mongoUtils.dbConn;


describe('Bill', function () {
    let bill = new Bill();
    bill.claimId = 'abc';
    bill._id = 'bill_id';
    let bi_1 = new BillingItem('task_id');
    bi_1.billId = 'bill_id';
    bill.billingItems = [bi_1];

    it('claimId is good', function (done) {
        assert.equal(bill.claimId, 'abc');
        assert.ok(bill);
        done()
    });

    it('gets with billingItems', function (done) {
        let db = mongoUtils.connect(config.db);

        let test = function (ret) {
            console.log(ret);
            let bill = ret[0];
            assert.equal(bill._id, 'bill_id');
            assert.equal(bill.billingItems[0].billId, 'bill_id');
            done();
        };
        db.then(_.partial(billingServices.getBillObjects,
            {_id: 'bill_id', owner: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']},
            false))
          .then(test);
    });
});
