// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Contact() {
        this.name;
        this.job;
        this.company;
        this.email;
        this.phone;
        this.cell;
    }

    return Contact;
});