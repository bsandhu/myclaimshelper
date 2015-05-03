// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    return {
        this.NOT_BILLABLE = 'NOT_BILLABLE';
        this.NOT_BILLED = 'NOT_BILLED';
        this.BILLED = 'BILLED';
        this.PAID = 'PAID';
    };

});
