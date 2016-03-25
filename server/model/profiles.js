// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./contact', './BillingProfile'], function (Contact, BillingProfile) {

  function UserProfile(){
    this._id = undefined;
    this.contactInfo = new Contact();

    // Default profile
    this.billingProfile = new BillingProfile();
  }

  return UserProfile;
});
