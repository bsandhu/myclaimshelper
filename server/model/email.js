// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Email() {
        this.from = undefined;
        this.to = undefined;
        this.cc = undefined;
        this.subject = undefined;
        this.body = undefined;

        // [{name: '', type: ''}]
        this.attachments = [];
    }

    return Email;
});
