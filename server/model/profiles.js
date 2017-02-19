// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./contact', './billingProfile'], function (Contact, BillingProfile) {

    function UserProfile() {
        this._id = undefined;
        this.contactInfo = new Contact();

        this.owner = undefined;
        // Primary group the user belongs to
        this.group = undefined;
        // secondary groups the user belongs to
        this.ingroups = undefined;

        // Feature flags
        this.isBillingEnabled = true;
        this.isClaimNoteEnabled = true;
        this.isClaimClaimantEnabled = true;
        this.isClaimDtEnabled = true;
        this.isClaimCoverageEnabled = true;
        this.isClaimCloseEnabled = true;

        // Default profile
        this.billingProfile = new BillingProfile();
    }

    return UserProfile;
});
