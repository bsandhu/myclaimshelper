// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./billingStatus'], function (BillingStatus) {

    function BillingItem() {
        // Id(s)
        this._id = undefined;
        this.billId = null;
        this.claimEntryId = null;

        // Overlap with ClaimEntry - so we can reproduce bill accurately
        this.entryDate = null;
        this.tag = null;
        this.summary = null;

        // Overlap with BillingProfile - so we can reproduce bill accurately
        this.timeRate = null;
        this.distanceRate = null;

        this.code = null; // is specific to Bill's need. How to generalize?
        this.mileage = 0;
        this.time = 0;
        this.expenseAmount = 0;
        this.totalAmount = 0;

        this.status = BillingStatus.NOT_SUBMITTED;
    }

    return BillingItem;
});

