var assert = require("assert");
var BillingItem = require("./../../server/model/billingItem.js");

describe('BillingItem', function(){
    var bi = new BillingItem('1');
    bi.description = "A billing item";

    it('sets claimEntryId', function (done) {
      assert.equal(bi.claimEntryId, '1');
      done();
    });
});

