// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Contact() {
        this._id = undefined;

        this.isBusiness = undefined;
        this.role = undefined;

        this.name = undefined;
        this.businessName = undefined;

        this.streetAddress = undefined;
        this.city = undefined;
        this.state = undefined;
        this.zip = undefined;

        this.email = undefined;
        this.phone = undefined;
        this.ext = undefined;
        this.cell = undefined;

        this.notes = undefined;
    }

    return Contact;
});