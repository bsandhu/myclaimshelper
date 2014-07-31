// Define these in the AMD format - so they can be shared with the client
// See AMDDefine - https://github.com/jrburke/amdefine

if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([], function () {

    function Claim() {
        this.entryDate;
        this.dueDate;
        this.updateDate;
        this.entryDate;
        this.summary;
        this.description;
        this.insured;
        this.claimant;
        this.location;
        this.insuranceCompany;
        this.insuranceCompanyFileNum;
    }

    return Claim;
});