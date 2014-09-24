define(['knockout', 'amplify', 'app/utils/events', 'text!app/components/notifier/notifier.tmpl.html'],
    function (ko, amplify, Events, notifierView) {

        function NotifierVM() {
            console.log('Init Notifier');

            this.isVisible = ko.observable(false);
            this.msg = ko.observable('');
            this.bootstrapCSS = ko.observable('');

            this.setupEventListeners();
        }

        NotifierVM.prototype.onDismiss = function () {
            this.msg('');
            this.isVisible(false);
            $("#notifier-container").velocity("stop");
        };

        NotifierVM.prototype.setupEventListeners = function () {
            amplify.subscribe(Events.SUCCESS_NOTIFICATION, this, onSuccess);
            amplify.subscribe(Events.FAILURE_NOTIFICATION, this, onFailure);

            function onSuccess(evData) {
                this.bootstrapCSS('alert alert-success alert-dismissible');
                this.display(evData.msg);
            }

            function onFailure(evData) {
                this.bootstrapCSS('alert alert-danger alert-dismissible');
                this.display(evData.msg);
            }
        };

        NotifierVM.prototype.display = function (msg) {
            this.msg(msg);
            this.isVisible(true);
            var panelRef = $("#notifier-container");
            panelRef.velocity("fadeIn",  { duration: 50, easing: 'easeIn'});
            panelRef.velocity("fadeOut", { delay: 5000, duration: 200, easing: 'easeOut'});
        };

        return {viewModel: NotifierVM, template: notifierView};

    });