// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function BillingProfile() {
      this.timeUnit = null; // e.g., .1 hour.
      this.distanceUnit = null;
      this.timeRate = null; // $ per unit.
      this.distanceRate = null;
      this.billingTypes = {}; // billing codes or custom types
    }

    return BillingProfile;
});

