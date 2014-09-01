// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Claim() {
        this._id = undefined;

        this.summary = undefined;
        this.description = undefined;

        this.dateReceived = undefined;
        this.dateDue = undefined;
        this.dateOfLoss = undefined;
        this.updateDate = undefined;

        this.locationStreetAddress = undefined;
        this.locationCity = undefined;
        this.locationZip = undefined;

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

        this.insuranceCompanyFileNum = undefined;
        this.insuranceCompanyName = undefined;

        this.attachmentIds = [];
    }

    return Claim;
});