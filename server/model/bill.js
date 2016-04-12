// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./billingStatus'], function (BillingStatus) {

    function Bill() {
        this._id = undefined;
        this.claimId = undefined;
        this.creationDate = undefined;
        this.submissionDate = undefined;
        this.paidDate = undefined;
        this.description = undefined;

        // Instance of Contact.
        // Contact details can change over time. Hence this is stored inlibe with the bill so that we can reproduce contact info exactly
        // as it appreaded at the time of bill submission.
        this.billRecipient = undefined;

        // Amounts
        this.preTaxTotal = undefined;
        this.taxRate = undefined;
        this.tax = undefined;
        this.total = undefined;

        // Category totals
        this.totalTime = 0;
        this.totalMileage = 0;
        this.totalExpenseAmount = 0;

        this.totalTimeInDollars = 0;
        this.totalMileageInDollars = 0;

        this.status = BillingStatus.NOT_SUBMITTED;

        // Note:
        // BillingItems has a -> to Bill
        // BillingService dynamically adds the BillingItems under the 'billingItems' attribute during GET Bill calls
    }

    return Bill;
});
