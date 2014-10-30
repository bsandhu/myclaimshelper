var assert = require("assert");
var Bill = require("./../../server/model/bill.js");

describe('Bill', function(){
    var bill = new Bill('abc');

    it('is good', function (done) {
      assert.equal(bill.Claim, 'abc');
      assert.ok(bill);
      done()
    });
});
