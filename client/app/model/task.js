define(['knockout'],
    function (ko) {

        function Task() {
            this.entryDate = ko.observable();
            this.dueDate = ko.observable();
            this.updateDate = ko.observable();

            this.summary = ko.observable();
            this.description = ko.observable();
            this.location = ko.observable();

            // TODO TimeSheet realated info
        };

        Task.prototype.clear = function(){
            for(attr in this) {
                if (ko.isObservable(this[attr])){
                    this[attr](null);
                    console.debug('Clearing attr: ' + attr);
                }
            }
        };

        return Task;
    });