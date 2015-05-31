// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./billingStatus'], function (BillingStatus) {

    function Bill(claimId) {
      this._id = undefined;
      this.claimId = claimId;
      this.billingDate = undefined;
      this.description = undefined;

      // Amounts
      this.preTaxTotal = undefined;
      this.taxRate = undefined;
      this.tax = undefined;
      this.total = undefined;

      this.status = BillingStatus.NOT_BILLED;

      // Note:
      // BillingItems has a -> to Bill
      // BillingService dynamically adds the BillingItems under the 'billingItems' attribute during GET Bill calls
    }
    return Bill;
});
