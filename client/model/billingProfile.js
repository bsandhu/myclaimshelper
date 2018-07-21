define([], function () {

    function BillingProfile() {
        // Billing Profile is per Claim. The BillingComponent creates one via the
        // billingProfileService#checkAndGetBillingProfileForClaimREST

        // Same as the claim id
        this._id;

        this.timeUnit = undefined; // e.g., .1 hour.
        this.distanceUnit = undefined;
        this.timeRate = undefined; // $ per unit.
        this.distanceRate = undefined;
        this.taxRate = undefined;
        this.billingTypes = {};
        this.printTmpl = 'Style 2';
        this.codes = {};
    }

    return BillingProfile;
});
