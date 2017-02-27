// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define(['./contactAddress', './contactEmail', './contactPhone'],
    function (ContactAddress, ContactEmail, ContactPhone) {

    function Contact() {
        this._id = undefined;

        this.category = undefined;
        this.subCategory = undefined;

        this.name = undefined;
        this.businessName = undefined;
        this.jobTitle = undefined;

        // [{type, street, city, state, zip}]
        this.addresses = [new ContactAddress()]

        // [{type, email}]
        this.emails = [new ContactEmail()]

        // [{type, phone, ext}]
        this.phones = [new ContactPhone()];

        this.notes = undefined;
    }

    return Contact;
});