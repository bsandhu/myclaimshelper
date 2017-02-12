// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function FileMetadata() {
        this.id = undefined;
        this.name = undefined;
        this.size = undefined;
        this.lastModifiedDate = undefined;

        this.owner = undefined;
        this.group = undefined;

        // No 'ingroups' for now - more work to pull this in on the incoming emails
        // this.ingroups = undefined;
    }

    return FileMetadata;
});