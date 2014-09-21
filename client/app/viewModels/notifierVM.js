define(['knockout', 'amplify', 'app/utils/events'], function (ko, amplify, Events) {

    function NotifierVM() {
        console.log('Init Notifier');

        this.isVisible = ko.observable(false);
        this.msg = ko.observable('');
        this.bootstrapCSS = ko.observable('');

        this.setupEventListeners();
    }

    NotifierVM.prototype.onDismiss = function () {
        this.msg('');
        var panelRef = $("#notifier-container");
        panelRef.velocity("fadeOut", { duration: 200});
    };

    NotifierVM.prototype.setupEventListeners = function () {
        amplify.subscribe(Events.SUCCESS_NOTIFICATION, this, onSuccess);
        amplify.subscribe(Events.FAILURE_NOTIFICATION, this, onFailure);

        function onSuccess(evData) {
            this.bootstrapCSS('alert alert-success alert-dismissible');
            this.display(evData.msg);
        };
        function onFailure(evData) {
            this.bootstrapCSS('alert alert-danger alert-dismissible');
            this.display(evData.msg);
        };
    }

    NotifierVM.prototype.display = function (msg) {
        this.msg(msg);
        var panelRef = $("#notifier-container");
        panelRef.velocity("fadeIn", { duration: 200});
        panelRef.velocity("fadeOut", { delay: 5000 , duration: 200});

    };

    return new NotifierVM();

});