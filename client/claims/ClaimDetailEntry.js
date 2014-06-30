define(['knockout'],
    function (ko) {

        function ClaimDetailEntry() {
            this._id  = ko.observable();
            this.claimId  = ko.observable();

            this.entryDate = ko.observable();
            this.dueDate = ko.observable();
            this.updateDate = ko.observable();

            this.summary = ko.observable();
            this.description = ko.observable();
            this.location = ko.observable();

            // TODO TimeSheet realated info
        };

        return ClaimDetailEntry;
    });