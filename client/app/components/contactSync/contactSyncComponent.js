define(['knockout', 'KOMap', 'jquery',
        'app/utils/ajaxUtils',
        'text!app/components/contactSync/contactSync.tmpl.html'],

    function (ko, KOMap, $, ajaxUtils, viewHtml) {

        function ContactSyncComponent() {
            this.showSpinner = ko.observable(false);
            this.successMsg = ko.observable('');
            this.failureMsg = ko.observable('');
        }

        ContactSyncComponent.prototype.onSyncContactsClick = function () {
            var isVisible = $('#contacts-syncPanel').is(':visible');
            isVisible
                ? $('#contacts-syncPanel').velocity('slideUp', {duration: 500})
                : $('#contacts-syncPanel').velocity('slideDown', {duration: 500});
        }

        ContactSyncComponent.prototype.onAddNowClick = function () {
            var _this = this;
            _this.notifyStart();

            // Get the OAuth2 url from the server
            $.get('/contactSync/auth')
                .then(function (data) {
                    console.log(data);

                    var dim = _this.getWinDimensions();
                    var win = window.open(data.url, 'Authorize', dim);
                    var exception = undefined;
                    var maxWaitInSecs = 60 * 5;
                    var secsElapsed = 0;
                    var timerIntervalInSecs = 1;

                    // Timer check for Google redirect to the success url
                    var timer = setInterval(function () {
                        secsElapsed = secsElapsed + 1;
                        exception = undefined;

                        // Clear interval if notfinished in maxWait
                        if (secsElapsed > maxWaitInSecs) {
                            window.clearInterval(timer);
                            win.close();
                        }

                        // Follow the OAuth url from the server
                        try {
                            var loc = win.location.href;
                        } catch (e) {
                            // Detect pop up blocker
                            if (win == undefined) {
                                window.clearInterval(timer);
                                _this.notifyEnd(false, 'Failed. Pop-up blocked. Please allow popups for this page and try again.');
                                // Todo show image
                            }
                            // Till Google redirects there is a CORS security exception
                            exception = e;
                            console.log(e);
                        }
                        if (!exception) {
                            // Parse url and pick the code
                            if (loc && loc.indexOf('code=') >= 0) {
                                window.clearInterval(timer);
                                var code = loc.substring(loc.indexOf('code=') + 'code='.length);
                                _this.passCode(code);
                                win.close();
                            }
                            if (!loc || loc.indexOf('error=') >= 0) {
                                console.info(loc);
                                window.clearInterval(timer);
                                win.close();
                                _this.notifyEnd(false, 'Could not authorize your Google account');
                            }
                        }
                    }, timerIntervalInSecs * 1000);
                });
        }

        ContactSyncComponent.prototype.notifyStart = function () {
            this.showSpinner(true);
            this.successMsg('Processing... this can take up to 30 seconds');
            this.failureMsg('');
        }

        ContactSyncComponent.prototype.notifyEnd = function (isSuccessful, msg) {
            this.showSpinner(false);
            this.successMsg(isSuccessful ? msg : '')
            this.failureMsg(!isSuccessful ? msg : '');
        }

        ContactSyncComponent.prototype.passCode = function (code) {
            var _this = this;
            console.log('Passing code to the server');
            console.log(code);

            ajaxUtils.post(
                '/contactSync/contacts',
                KOMap.toJSON({code: code, thin: true,}),
                function onSuccess(response) {
                    console.log(response);
                    if (response.status == 'Success') {
                        _this.notifyEnd(true, 'Finished. ' + response.data);
                    } else {
                        _this.notifyEnd(false, 'Finished. ' + response.data);
                    }
                },
                function onFail(response) {
                    console.log(response);
                    _this.notifyEnd(false, 'Processing failed... error on the server');
                });
        };

        ContactSyncComponent.prototype.getWinDimensions = function () {
            var w = 420;
            var h = window.screen.height / 2;
            var left = (window.screen.width / 2) - (w / 2);
            var top = (window.screen.height / 2) - (h / 2);
            return 'left=' + left + ',' +
                'top=' + top + ',' +
                'width=' + w + ',' +
                'height=' + h + ',' +
                'resizable=yes,' +
                'scrollbars=yes,' +
                'status=no,' +
                'menubar=no';
        }

        return {viewModel: ContactSyncComponent, template: viewHtml};
    });