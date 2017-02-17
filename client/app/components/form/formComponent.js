define(['knockout', 'KOMap', 'jquery', 'underscore', 'bootbox',
        'amplify', 'app/utils/events', 'app/utils/ajaxUtils', 'app/utils/router',
        'shared/objectUtils', 'app/utils/audit', 'app/utils/session',
        'model/form',
        'text!app/components/form/proofOfLoss.tmpl.html',
        'text!app/components/form/anotherForm.tmpl.html',
        'text!app/components/form/formComponent.tmpl.html'],
    function (ko, KOMap, $, _, bootbox, amplify, Events, ajaxUtils, Router, ObjectUtils, Audit, Session,
              Form, proofOfLossTmpl, anotherForm, viewHtml) {
        'use strict';

        function FormsComponentVM(params) {
            console.log('Init Forms Widget');
            this.ObjectUtils = ObjectUtils;

            // View state
            this.readyToRender = ko.observable(false);
            this.activeFormTmpl = ko.observable('');
            this.form = ko.observable(KOMap.fromJS(new Form()));

            this.setupEvListeners();
        }

        FormsComponentVM.prototype.sum = function (fields) {
            let result = 0;
            fields.forEach((field) => {
                let fieldObsrv = this.form().data()[field];
                let fieldVal = Number(fieldObsrv());
                if (_.isNumber(fieldVal)) {
                    result = result + fieldVal;
                }
            });
            return result;
        }

        FormsComponentVM.prototype.newEmptyClaimForm = function (type) {
            let activeClaim = Session.getActiveClaim();
            let newForm = KOMap.fromJS(new Form());

            newForm.claimId(activeClaim._id);
            newForm.updateDate(new Date());
            newForm.creationDate(new Date());
            newForm.type(type);

            // Copy active claim attributes
            // From data is an observable with nested observables so the tmpl picks up
            // changes whne the forms are switched
            newForm.data = ko.observable(KOMap.fromJS(_.extend({}, activeClaim, newForm.data)));
            delete newForm.data().attachments;

            return newForm;
        }

        FormsComponentVM.prototype.initFormTmpl = function () {
            if (this.form().type() == 'proofOfLoss') {
                this.activeFormTmpl(proofOfLossTmpl);
            }
            if (this.form().type() == 'anotherForm') {
                this.activeFormTmpl(anotherForm);
            }
        }

        FormsComponentVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_FORM, this, this.onShowClaimForm);
            amplify.subscribe(Events.CREATE_NEW_FORM, this, this.onNewClaimForm);
        }

        FormsComponentVM.prototype.onShowClaimForm = function (evData) {
            console.log('FormsComponentVM - SHOW_CLAIM_FORM ev ' + JSON.stringify(evData));
            this.loadClaimForm(evData.formId)
                .then(() => {
                    this.initFormTmpl();
                    this.readyToRender(true);
                });
        }

        FormsComponentVM.prototype.onNewClaimForm = function (evData) {
            console.log('FormsComponentVM - NEW_CLAIM_FORM ev ' + JSON.stringify(evData));

            if (!evData.hasOwnProperty('formType')) {
                throw "Form type must be specified";
            }
            if (!evData.hasOwnProperty('claimId')) {
                throw "ClaimId must be specified";
            }
            if (Session.getActiveClaimId() != evData.claimId) {
                throw "Form can be added only to active claim";
            }

            this.form(this.newEmptyClaimForm(evData.formType));
            this.initFormTmpl();
            this.readyToRender(true);
        };

        FormsComponentVM.prototype.onClose = function () {
            Router.routeToClaim(Session.getActiveClaimId());
        };

        /***********************************************************/
        /* Server calls                                            */
        /***********************************************************/

        FormsComponentVM.prototype.loadClaimForm = function (formId) {
            let defer = $.Deferred();
            ajaxUtils.getJSON('/form/' + formId)
                .done(function (resp) {
                    console.log('Loaded claim form ' + JSON.stringify(resp.data).substr(0, 100));

                    // Populate with JSON data
                    let formJSON = resp.data;
                    let formData = formJSON.data;
                    delete formJSON.data;

                    let formObserv = KOMap.fromJS(formJSON);
                    formObserv.data = ko.observable(KOMap.fromJS(formData));
                    this.form(formObserv);

                    defer.resolve();
                    Audit.info('ViewForm', {_id: this.form()._id(), type: this.form().type()});
                }.bind(this));
            return defer;
        }

        FormsComponentVM.prototype.onSave = function () {
            let defer = $.Deferred();
            this.form().updateDate(new Date());

            let formDataJS = KOMap.toJS(this.form().data());
            let formJS = KOMap.toJS(this.form());
            formJS.data = formDataJS;
            console.log('Saving Form: ' + formJS);

            ajaxUtils.post(
                '/form',
                JSON.stringify(formJS),
                function onSuccess(response) {
                    console.log('Saved Form: ' + JSON.stringify(response));
                    this.form()._id(response.data._id)
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved form'});
                    amplify.publish(Events.SAVED_CLAIM_FORM, {
                        claimId: response.data.claimId,
                        claimFormId: response.data._id
                    });

                    //Router.routeToClaim(Session.getActiveClaimId());
                    Audit.info('SavedForm', {_id: this.form()._id(), type: this.form().type()});
                    defer.resolve();
                }.bind(this));
            return defer;
        }

        FormsComponentVM.prototype.onEmail = function (claimId) {
            let htmlContent = $('#claimFormPrintContainer')[0].innerHTML;

            let url = '/emailForm';
            let params = {htmlContent: $('<div>').text(htmlContent).html()};

            $.when($.get("/css/app.css"))
                .then(css => {
                        ajaxUtils.post(
                            '/emailPdf',
                            JSON.stringify({htmlContent: '<style>' + css + '</style>' + htmlContent}),
                            () => {
                                alert('Done')
                            }
                        )
                    }
                );
        }

        FormsComponentVM.prototype.onConvertToPdf = function (claimId) {
            let htmlContent = $('#claimFormPrintContainer')[0].innerHTML;

            let url = '/convertToPdf';
            let params = {htmlContent: $('<div>').text(htmlContent).html()};

            $.when($.get("/css/app.css"))
                .then(css => {
                    let form = $('<form method="POST" action="' + url + '">');
                    $('<input>')
                        .attr('type', 'hidden')
                        .attr('name', 'htmlContent')
                        .val('<style>' + css + '</style>' + htmlContent)
                        .appendTo(form);
                    $('body').append(form);
                    form.submit();
                })
        }

        FormsComponentVM.prototype.printForm = function (claimId) {
            $('#print-template').html(proofOfLossTmpl);
            let container = document.createElement("div");
            let _this = this;

            // Add frame
            let frame = document.createElement('iframe');
            document.body.appendChild(frame);

            // Print
            let frameContent = frame.contentWindow;
            frameContent.document.open();
            frameContent.document.write('<head><link rel=stylesheet href=../../css/app.css type=text/css ></head>');
            frameContent.document.write('<head><link rel=stylesheet href=../../css/formPrint.css type=text/css ></head>');
            frameContent.document.write($('#claimFormPrintContainer')[0].innerHTML);
            frameContent.document.close();
            setTimeout(function afterFrameRender() {
                frameContent.focus();
                frameContent.print();
                document.body.removeChild(frame);
            }, 500);
            Audit.info('Print' + this.activeFormTmplNames, {});
        }

        return {viewModel: FormsComponentVM, template: viewHtml};
    });