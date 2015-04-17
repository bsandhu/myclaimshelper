// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function BillingItem(claimEntryId) {
        this._id = undefined;
        this.claimEntryId = claimEntryId;
        this.billId = null;
        this.description = null;
        this.code = null; // is specific to Bill's need. How to generalize?
        this.mileage = null;
        this.time = null;
        this.expenseType = null;
        this.expenseAmount = null;
    }

    return BillingItem;
});

