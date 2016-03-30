// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function BillingProfile() {
        // Same as the claim id
        this._id;

        this.timeUnit = undefined; // e.g., .1 hour.
        this.distanceUnit = undefined;
        this.timeRate = undefined; // $ per unit.
        this.distanceRate = undefined;
        this.taxRate = undefined;
        this.billingTypes = {}; // billing codes or custom types
    }

    return BillingProfile;
});
