// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    return {
        NOT_BILLABLE : 'Not Billable',
        NOT_BILLED   : 'Not Billed',
        BILLED       : 'Billed',
        PAID         : 'Paid'
    };

});
