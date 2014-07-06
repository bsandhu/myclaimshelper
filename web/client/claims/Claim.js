define(['knockout'],
    function (ko) {

        function Claim() {
            this._id  = ko.observable();

            this.entryDate = ko.observable();
            this.dueDate = ko.observable();
            this.updateDate = ko.observable();

            this.summary = ko.observable();
            this.description = ko.observable();
            this.insured = ko.observable();
            this.claimant = ko.observable();
            this.location = ko.observable();
            this.insuranceCompany = ko.observable();
            this.insranceCoFileNum = ko.observable();
        };

        return Claim;
    });