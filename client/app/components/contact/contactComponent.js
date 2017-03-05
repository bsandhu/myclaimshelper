define(['knockout', 'KOMap', 'maskedInput', 'bootbox',
        'app/components/contact/contactUtils',
        'text!app/components/contact/contactComponent.tmpl.html', 'model/contact'],

    function (ko, KOMap, maskedInput, bootbox, ContactUtils, viewHtml, Contact) {
        'use strict';

        function ContactComponentVM(params) {
            console.log('Init Contact Widget');
            this.ContactUtils = ContactUtils;

            if (!params.hasOwnProperty('contact')) {
                throw 'Expecting Contact obj as a param';
            }

            this.placeholder = ko.observable(params.hasOwnProperty('placeholder') ? params.placeholder : 'Name');
            this.showDetails = ko.observable(params.hasOwnProperty('showDetails') ? ko.utils.unwrapObservable(params.showDetails) : false);
            this.expandCollapseLabel = ko.computed(() => {return this.showDetails() ? 'Collapse' : 'Expand';
            }, this);
            this.allowEdits = ko.observable(params.hasOwnProperty('allowEdits') ? ko.utils.unwrapObservable(params.allowEdits) : true);
            this.contact = ko.utils.unwrapObservable(params.contact);
            this.idSuffix = ko.observable(params.idSuffix);
            this.states = ko.observable([
                'NY',
                'NJ',
                'NH',
                'CT',
                'PA',
                'AL',
                'AK',
                'AZ',
                'AR',
                'CA',
                'CO',
                'DE',
                'FL',
                'GA',
                'HI',
                'ID',
                'IL',
                'IN',
                'IA',
                'KS',
                'KY',
                'LA',
                'ME',
                'MD',
                'MA',
                'MI',
                'MN',
                'MS',
                'MO',
                'MT',
                'NE',
                'NV',
                'NM',
                'NC',
                'ND',
                'OH',
                'OK',
                'OR',
                'RI',
                'SC',
                'SD',
                'TN',
                'TX',
                'UT',
                'VT',
                'VA',
                'WA',
                'WV',
                'WI',
                'WY',
                '---']);
        }

        ContactComponentVM.prototype.onDetailsClick = function () {
            this.showDetails(!this.showDetails());
        };

        // ************ Phone ************

        ContactComponentVM.prototype.onAddPhone = function () {
            this.contact.phones.push(KOMap.fromJS({type: '', phone: '', ext: ''}));
        };

        ContactComponentVM.prototype.onDeletePhone = function (index, phone, mouseEvent) {
            let dialog = createConfirmDialog('Remove Phone?', onConfirm.bind(this));
            positionConfirmDialog(dialog, mouseEvent);
            function onConfirm() {
                let arr = this.contact.phones();
                this.contact.phones(arr.filter((elem, idx) => idx != index));
            }
        };

        // ************ Email ************

        ContactComponentVM.prototype.onAddEmail = function () {
            this.contact.emails.push(KOMap.fromJS({type: '', email: ''}));
        };

        ContactComponentVM.prototype.onDeleteEmail = function (index, email, mouseEvent) {
            let dialog = createConfirmDialog('Remove Email?', onConfirm.bind(this));
            positionConfirmDialog(dialog, mouseEvent);
            function onConfirm() {
                let arr = this.contact.emails();
                this.contact.emails(arr.filter((elem, idx) => idx != index));
            }
        };

        // ************ Address ************

        ContactComponentVM.prototype.onAddAddress = function () {
            this.contact.addresses.push(KOMap.fromJS({type: 'Work', street: '', city: '', state: '---', zip: ''}));
        };

        ContactComponentVM.prototype.onDeleteAddress = function (index, address, mouseEvent) {
            let dialog = createConfirmDialog('Remove Address?', onConfirm.bind(this));
            positionConfirmDialog(dialog, mouseEvent);
            function onConfirm() {
                let arr = this.contact.addresses();
                this.contact.addresses(arr.filter((elem, idx) => idx != index));
            }
        };

        function createConfirmDialog(title, yesCallback) {
            let dialog = bootbox.dialog({
                title: "",
                message: title,
                size: "small",
                buttons: {
                    no: {label: "No", className: "btn-danger", callback: $.noop},
                    yes: {label: "Yes", className: "btn-info", callback: yesCallback}
                }
            });
            return dialog;
        }

        function positionConfirmDialog(dialog, mouseEvent) {
            dialog.find('.modal-dialog')
                .css({
                    'margin-left': mouseEvent.x + 'px'
                });
            dialog.find('.modal-content')
                .css({
                    'margin-top': () => mouseEvent.y + 'px',
                });
            dialog.find('.modal-footer')
                .css({
                    'border-top': () => 'none',
                });
        }

        return {viewModel: ContactComponentVM, template: viewHtml};
    });