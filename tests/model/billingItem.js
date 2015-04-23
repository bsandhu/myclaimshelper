var assert = require("assert");
var BillingItem = require("./../../server/model/billingItem.js");

describe('BillingItem', function(){
    var bi = new BillingItem('1');
    bi.description = "A billing item";

    it('sets defaults', function (done) {
      assert.equal(bi.expenseAmount, 0);
      assert.equal(bi.mileage, 0);
      assert.equal(bi.time, 0);
      done();
    });
});

