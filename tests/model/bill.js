var assert = require("assert");
var Bill = require("./../../server/model/bill.js");
var BillingItem = require("./../../server/model/billingItem.js");
var billingServices = require("./../../server/services/billingServices.js");
var config = require("./../../server/config.js");
var mongoUtils = require("./../../server/mongoUtils.js");
var _ = require('underscore');

mongoUtils.initConnPool();
var db = mongoUtils.dbConn;


describe('Bill', function(){
    var bill = new Bill('abc');
    var bi1 = new BillingItem('1');
    bill.billingObjects = [bi1];

    it('is good', function (done) {
      assert.equal(bill.claimId, 'abc');
      assert.ok(bill);
      done()
    });

    it('saves with billingObjects', function(done){
      // 'ret' is a duple (err, success).
      // other functions return a promise resolved or rejected.
      // should normalize these return values/types.
      var test = function(ret){
        console.log(ret);
        var billingItem = ret[0][1];
        var bill = ret[1][1];
        assert.equal(billingItem.claimEntryId, 1);
        assert.equal(bill.claimId, 'abc');
        done();
      };
      billingServices.saveBillObject(bill, db).then(test);
      
    });
});
