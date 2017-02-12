// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Claim() {
        this._id = undefined;
        this.fileNum = undefined;

        this.description = undefined;
        // Location is stored a Google maps data structure
        this.location = undefined;
        this.lossType = undefined;
        this.isClosed = false;

        // Dates
        this.dateReceived = undefined;
        this.dateDue = undefined;
        this.dateOfLoss = undefined;

        this.validFromDate = undefined;
        this.validToDate = undefined;

        this.updateDate = undefined;
        this.entryDate = undefined;
        this.dateClosed = undefined;

        // Contacts added by the user
        // Array of ContactInfp: {category, subCategory, contact}
        // Note: the service links the contact object to the Contact collection
        this.contacts = [];

        // Expenses added by the user
        // Array of ExpenseInfp: {category, subCategory, amount}
        this.expenses = [];

        // Attachments descriptors - the content is stored in Momgo GridFS
        this.attachments = [];

        // ClaimEntry - FK via the ClaimEntries collection
        // Forms - FK via the FormData collection
        // BillingProfile - FK via the BillingProfiles collection

        this.insuranceCompanyPolicyNum = undefined;
        this.insuranceCompanyFileNum = undefined;
        this.insuranceCompanyName = undefined;

        // TODO, Complete, Pending
        this.state = undefined;
        this.owner = undefined;
    }

    return Claim;
});