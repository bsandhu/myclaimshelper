// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function ClaimEntry() {
        this._id = undefined;
        this.claimId = undefined;
        this.tag = [];
        this.isClosed = false;

        // Tie breaker field for user ordered tasks
        this.displayOrder;

        this.entryDate = undefined;
        this.dueDate = undefined;
        this.updateDate = undefined;

        this.summary = undefined;
        this.description = undefined;

        // Attachments descriptors - the content is stored in Momgo GridFS
        // Type: FileMetadata
        this.attachments = [];

        // Status - one of states.ts
        this.state = undefined;

        this.location = undefined;

        // Instance of BillingItem - dynamically populated by service
        this.billingItem = undefined;
    }

    return ClaimEntry;
});