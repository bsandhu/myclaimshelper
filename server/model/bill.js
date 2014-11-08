// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {
    function Bill(claimId, claimEntryIds) {
      this.claimId = claimId;
      this.claimEntryIds = claimEntryIds;
      this.description = undefined;
    }
    return Bill;
});
