// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Claim() {
        this._id = undefined;

        this.description = undefined;

        this.dateReceived = undefined;
        this.dateDue = undefined;
        this.dateOfLoss = undefined;
        this.updateDate = undefined;
        this.entryDate = undefined;

        this.locationStreetAddress = undefined;
        this.locationCity = undefined;
        this.locationZip = undefined;

        // All the contacts are instances of 'Contact'
        this.insuredContact = undefined;
        this.insuredContactId = undefined;

        this.insuredAttorneyContact = undefined;
        this.insuredAttorneyContactId = undefined;

        this.claimantContact = undefined;
        this.claimantContactId = undefined;

        this.claimantsAttorneyContact = undefined;
        this.claimantsAttorneyContactId = undefined;

        this.insuranceCoContactId = undefined;
        this.insuranceCoContact = undefined;

        // Additional contacts added by the user
        // Instance of Contact object(s)
        this.otherContacts = [];
        this.otherContactIds = [];

        this.insuranceCompanyFileNum = undefined;
        this.insuranceCompanyName = undefined;

        // TODO, Complete, Pending
        this.state = undefined;
    }

    return Claim;
});