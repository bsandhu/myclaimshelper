// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function ContactAddress() {
        this.type = 'Work';
        this.street = '';
        this.city = '';
        this.state = '---';
        this.zip = '';
    }

    return ContactAddress;
});