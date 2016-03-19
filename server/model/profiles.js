// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

function BillingProfile() {
  this.timeUnit = undefined; // e.g., .1 hour.
  this.distanceUnit = undefined;
  this.timeRate = undefined; // $ per unit.
  this.distanceRate = undefined;
  this.taxRate = undefined;
  this.billingTypes = {}; // billing codes or custom types
}

define(['./contact'], function (Contact) {

  function UserProfile(){
    this._id = undefined;
    this.contactInfo = new Contact();
    this.billingProfile = new BillingProfile();
  }

  return UserProfile;
});
