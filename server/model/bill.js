// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {
    function Bill(claimId, claimEntryIds) {
      this.Claim = claimId;
      this.ClaimEntryIds = claimEntryIds;
    }
    return Bill;
});

function computeTotals(bill, billingProfile){
  var billingItems = getBillingItems(bill);
  var mileage = 0;
  for (var i=0; billingItems.length; i++){
    mileage += billingItems[i].mileage;
  }

};


function getBillingItems(bill){
      var result = [];
      for (var i=0; bill.ClaimEntries.length; i++){
        //Array.prototype.push.apply(result, bill.ClaimEntries[i].billingItems);
        result.push(bill.ClaimEntries[i].billingItems);
      }
      return result;
    };

