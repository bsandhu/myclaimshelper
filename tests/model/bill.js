var assert = require("assert");
var Bill = require("./../../server/model/bill.js");

describe('Bill', function(){
    var bill = new Bill('abc', [1,2]);

    it('is good', function (done) {
      assert.equal(bill.claimId, 'abc');
      assert.deepEqual(bill.claimEntryIds, [1,2]);
      assert.ok(bill);
      done()
    });
});
