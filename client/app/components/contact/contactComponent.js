define(['knockout', 'text!app/components/contact/contactComponent.tmpl.html', 'model/contact'],

    function (ko, viewHtml, Contact) {
        'use strict';

        function ContactComponentVM(params) {
            console.log('Init Contact Widget');

            if (!params.hasOwnProperty('contact')) {
                throw 'Expecting Contact obj as a param';
            }

            if (!params.hasOwnProperty('isBusinessOptionApplicable')) {
                throw 'Expecting `isBusinessOptionApplicable` as a param';
            }

            this.showDetails = ko.observable(false);
            this.contact     = params.contact;
            this.idSuffix    = ko.observable(params.idSuffix);

            this.isBusinessOptionApplicable = ko.observable();
            this.setupBusinessTypeOption(params.isBusinessOptionApplicable);
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