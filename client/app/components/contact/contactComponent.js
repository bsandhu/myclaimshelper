define(['knockout', 'maskedInput', 'text!app/components/contact/contactComponent.tmpl.html', 'model/contact'],

    function (ko, maskedInput, viewHtml, Contact) {
        'use strict';

        function ContactComponentVM(params) {
            console.log('Init Contact Widget');

            if (!params.hasOwnProperty('contact')) {
                throw 'Expecting Contact obj as a param';
            }

            if (!params.hasOwnProperty('isBusinessOptionApplicable')) {
                throw 'Expecting `isBusinessOptionApplicable` as a param';
            }

            this.placeholder = ko.observable(params.hasOwnProperty('placeholder') ? params.placeholder : 'Name');
            this.showDetails = ko.observable(params.hasOwnProperty('showDetails') ? params.showDetails : false);
            this.allowEdits  = ko.observable(params.hasOwnProperty('allowEdits') ? params.allowEdits : true);
            this.contact     = params.contact;
            this.idSuffix    = ko.observable(params.idSuffix);

            this.isBusinessOptionApplicable = ko.observable();
            this.setupBusinessTypeOption(params.isBusinessOptionApplicable);

            $().ready(function maskTelFields(){
                $('input[type=tel]').mask("999-999-9999");
            });
        }

        ContactComponentVM.prototype.setupBusinessTypeOption = function(bizTypeApplicable) {
            if (bizTypeApplicable) {
                this.isBusinessOptionApplicable(true);
            } else {
                this.isBusinessOptionApplicable(false);
                this.contact().isBusiness(false);
            }
        };

        ContactComponentVM.prototype.onDetailsClick = function () {
            this.showDetails(!this.showDetails());
        };

        return {viewModel: ContactComponentVM, template: viewHtml};
    });