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
        this.entryDate = null; // Is the DueDate of the ClaimEntry
        this.tag = null;
        this.summary = null;

        // Overlap with BillingProfile - so we can reproduce bill accurately
        this.timeRate = null;
        this.distanceRate = null;

        this.mileageCode = null; // Sourced from user profile
        this.timeCode = null; // Sourced from user profile
        this.expenseCode = null; // Sourced from user profile

        this.mileage = 0;
        this.time = 0;
        this.expenseAmount = 0;
        this.totalAmount = 0;

        this.status = BillingStatus.NOT_SUBMITTED;
    }

    return BillingItem;
});

