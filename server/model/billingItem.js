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
        this.description = null;

        this.code = null; // is specific to Bill's need. How to generalize?
        this.mileage = 0;
        this.time = 0;
        this.expenseAmount = 0;

            this.status = BillingStatus.NOT_BILLED;
    }

    return BillingItem;
});

