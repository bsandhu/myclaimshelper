define(['knockout', 'KOMap', 'jquery', 'underscore', 'bootbox',
        'amplify', 'app/utils/events', 'app/utils/ajaxUtils', 'app/utils/router',
        'shared/objectUtils',
        'shared/dateUtils',
        'app/utils/audit', 'app/utils/session',
        'model/form', 'model/email',
        'app/components/contact/contactUtils',
        'text!app/components/form/proofOfLoss.tmpl.html',
        'text!app/components/form/regulation10.tmpl.html',
        'text!app/components/form/subrogationReceipt.tmpl.html',
        'text!app/components/form/formComponent.tmpl.html'],
    function (ko, KOMap, $, _, bootbox, amplify, Events, ajaxUtils, Router, ObjectUtils, DateUtils, Audit, Session,
              Form, Email, ContactUtils, proofOfLossTmpl, regulation10, subrogationReceipt, viewHtml) {
        'use strict';

        function FormsComponentVM(params) {
            console.log('Init Forms Widget');
            this.ObjectUtils = ObjectUtils;

            // View state
            this.readyToRender = ko.observable(false);
            this.activeFormTmpl = ko.observable('');
            this.form = ko.observable(KOMap.fromJS(new Form()));
            this.email = ko.observable(KOMap.fromJS(new Email()));
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
            newForm.displayName(ObjectUtils.camelcaseToSpaces(type));

            // Copy active claim attributes
            // From data is an observable with nested observables so the tmpl picks up
            // changes when the forms are switched
            newForm.data = ko.observable(KOMap.fromJS(_.extend({}, activeClaim, newForm.data)));
            delete newForm.data().attachments;

            // Pre-populate know fields from Claim
            // Proof Of Loss
            if (type == 'proofOfLoss') {
                newForm.data()._id(activeClaim.insuranceCompanyPolicyNum);
                newForm.data().e(activeClaim.fileNum);
                newForm.data().b('See Schedule "A"');
                newForm.data().f(activeClaim.insuranceCompanyClaimNum);
                newForm.data().c(DateUtils.niceLocaleDate(activeClaim.validFromDate, '', false));
                newForm.data().d(DateUtils.niceLocaleDate(activeClaim.validToDate, '', false));
                newForm.data().i(activeClaim.insuranceCompanyName);
                if (ContactUtils.parseInsured(activeClaim)) {
                    newForm.data().k(ContactUtils.parseInsured(activeClaim).name || '');
                    newForm.data().al(ContactUtils.parseInsured(activeClaim).name || '');
                }
                // Date of loss
                newForm.data().p(DateUtils.dayOfMonth(activeClaim.dateOfLoss));
                newForm.data().q(DateUtils.month(activeClaim.dateOfLoss));
                newForm.data().r(DateUtils.year(activeClaim.dateOfLoss));
                newForm.data().v('As Permitted');
                newForm.data().y('Owner');
                newForm.data().ac('As Per Policy');
                newForm.data().af('See Schedule "A"');
                newForm.data().an('X');

                // Schedule 'A' population
                if (_.isArray(activeClaim.expenses)) {
                    let item1 = activeClaim.expenses[0];
                    let item2 = activeClaim.expenses[1];
                    let item3 = activeClaim.expenses[2];
                    let item4 = activeClaim.expenses[3];
                    if (_.isObject(item1)) {
                        newForm.data().au(item1.amount);
                        newForm.data().av(item1.subCategory);
                    }
                    if (_.isObject(item2)) {
                        newForm.data().aw(item2.amount);
                        newForm.data().ax(item2.subCategory);
                    }
                    if (_.isObject(item3)) {
                        newForm.data().ay(item3.amount);
                        newForm.data().az(item3.subCategory);
                    }
                    if (_.isObject(item4)) {
                        newForm.data().ba(item4.amount);
                        newForm.data().bb(item4.subCategory);
                    }
                }
                // Schedule 'A' - loss location
                let lossLoc = activeClaim.location;
                if (lossLoc) {
                    newForm.data().ef(lossLoc.formatted_address);
                }
            }

            return newForm;
        }

        FormsComponentVM.prototype.initFormTmpl = function () {
            if (this.form().type() == 'proofOfLoss') {
                this.activeFormTmpl(proofOfLossTmpl);
                this.email().attachments([{name: 'ProofOfLoss.pdf'}]);
                this.email().subject('Sending ProofOfLoss');
            }
            if (this.form().type() == 'regulation10') {
                this.activeFormTmpl(regulation10);
                this.email().attachments([{name: 'Regulation10.pdf'}]);
                this.email().subject('Sending Regulation 10');
            }
            if (this.form().type() == 'subrogationReceipt') {
                this.activeFormTmpl(subrogationReceipt);
                this.email().attachments([{name: 'SubrogationReceipt.pdf'}]);
                this.email().subject('Sending Subrogation Receipt');
            }
        }

        FormsComponentVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_FORM, this, this.onShowClaimForm);
            amplify.subscribe(Events.CREATE_NEW_FORM, this, this.onNewClaimForm);
            amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                this.email().from(Session.getCurrentUserProfile().contactInfo.email);
                this.email().cc(Session.getCurrentUserProfile().contactInfo.email);
            });
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

        FormsComponentVM.prototype.onDeleteForm = function () {
            let defer = $.Deferred();

            let dialog = bootbox.dialog({
                title: "",
                message: "Delete this Form permanently ?",
                buttons: {
                    no: {label: "No", className: "btn-danger", callback: $.noop},
                    yes: {label: "Yes", className: "btn-info", callback: onConfirm.bind(this)}
                }
            });

            function onConfirm() {
                let form = this.form();
                let name = form.displayName ? form.displayName() : form.type();

                ajaxUtils.post(
                    '/form/delete',
                    JSON.stringify({id: form._id(), name: name}),
                    function onSuccess(response) {
                        console.log('Deleted Form: ' + JSON.stringify(response));
                        amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: `Deleted form ${name}`});
                        Router.routeToClaim(Session.getActiveClaimId());
                        defer.resolve();
                    }.bind(this));
            }
            return defer;
        }

        FormsComponentVM.prototype.onEmail = function (claimId) {
            let htmlContent = $('#claimFormPrintContainer')[0].innerHTML;
            let url = '/emailForm';
            let _this = this;

            $.when($.get("/css/app.css"))
                .then(css => {
                        ajaxUtils.post(
                            '/emailPdf',
                            JSON.stringify({
                                htmlContent: '<style>' + css + '</style>' + htmlContent,
                                email: KOMap.toJS(_this.email())
                            }),
                            function onSuccess(resp) {
                                alert('ok')
                            },
                            function onFailure(resp) {
                                amplify.publish(
                                    Events.FAILURE_NOTIFICATION,
                                    {msg: "<strong> Failed to email form - " + resp.responseJSON.Details + "</strong><br/>"});
                            }
                        )
                    }
                );
        }

        FormsComponentVM.prototype.onConvertToPdf = function (claimId) {
            let htmlContent = $('#claimFormPrintContainer')[0].innerHTML;
            let url = '/convertToPdf';
            let _this = this;

            $.when($.get("/css/app.css?hash=" + new Date().getTime()))
                .then(css => {
                    let form = $('<form method="POST" action="' + url + '">');
                    $('<input>')
                        .attr('type', 'hidden')
                        .attr('name', 'htmlContent')
                        .val('<style>' + css + '</style>' + htmlContent)
                        .appendTo(form);

                    $('<input>')
                        .attr('type', 'hidden')
                        .attr('name', 'formName')
                        .val(_this.form().type() + '.pdf')
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