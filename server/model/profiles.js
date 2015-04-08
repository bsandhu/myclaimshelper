// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function BillingProfile() {
      this.timeUnit = undefined; // e.g., .1 hour.
      this.distanceUnit = undefined;
      this.timeRate = undefined; // $ per unit.
      this.distanceRate = undefined;
      this.billingTypes = {}; // billing codes or custom types
    }

    return BillingProfile;
});


define([], function () {

  function UserProfile(){
    this.userId = undefined;
    this.userName = undefined; // TODO should this link/be in a Contact?
    this.billingProfile = undefined;
  }

  return UserProfile;
});
