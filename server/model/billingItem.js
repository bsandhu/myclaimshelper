// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function BillingItem() {
        // Id(s)
        this._id = undefined;
        this.billId = null;
        this.description = null;

        this.code = null; // is specific to Bill's need. How to generalize?
        this.mileage = 0;
        this.time = 0;
        this.expenseAmount = 0;

        this.STATUS_NOT_BILLABLE = 'NOT_BILLABLE';
        this.STATUS_NOT_BILLED = 'NOT_BILLED';
        this.STATUS_BILLED = 'BILLED';
        this.STATUS_PAID = 'PAID';
        this.status = this.STATUS_NOT_BILLED;
    }

    return BillingItem;
});

