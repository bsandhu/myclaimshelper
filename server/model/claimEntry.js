// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function ClaimEntry() {
        this._id = undefined;
        this.claimId = undefined;

        this.entryDate = undefined;
        this.dueDate = undefined;
        this.updateDate = undefined;

        this.summary = undefined;
        this.description = undefined;
    }

    return ClaimEntry;
});
