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

        this.entryDate = undefined;
        this.dueDate = undefined;
        this.updateDate = undefined;

        this.summary = undefined;
        this.description = undefined;

        // Attachments descriptors - the content is stored in Momgo GridFS
        this.attachments = [];

        // Status - one of states.js
        this.state = undefined;

        this.location = undefined;

        this.billingItems = [];
    }

    return ClaimEntry;
});
