define(['knockout', 'KOMap', 'underscore',
        'text-loader!app/components/contact/addContactComponent.tmpl.html', 'model/contact',
        'app/components/contact/contactUtils',
        'app/utils/ajaxUtils', 'amplify', 'app/utils/events', 'app/components/contact/contactClient',
        'app/utils/audit'],

    function (ko, KOMap, _, viewHtml, Contact, ContactUtils, AjaxUtils, amplify, Events, ContactClient, Audit) {
        'use strict';

        function AddContactComponentVM(params) {
            console.log('Init Add Contact Widget');

            this.readyToRender = ko.observable(false);
            this.contact = ContactUtils.initContact();
            this.contacts = ko.observableArray([this.contact]);
            this.popupTitle = ko.observable('');
            this.setupEvListeners();
        }

        AddContactComponentVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CONTACT, this, this.onShowContact);
            amplify.subscribe(Events.ADD_CONTACT, this, this.onAddContact);
        };

        AddContactComponentVM.prototype.onShowContact = function (evData) {
            console.log('AddContactComponentVM - SHOW_CONTACT ev ' + JSON.stringify(evData));
            this.readyToRender(true);
            this.popupTitle('Contact details');
            this.loadContact(evData.contactId);
            Audit.info('ViewContact', {_id: evData.contactId});
        };

        AddContactComponentVM.prototype.onAddContact = function () {
            console.log('AddContactComponentVM - ADD_CONTACT ev ');
            this.readyToRender(true);
            this.popupTitle('Add new contact');
            this.addContact();
            Audit.info('AddContact');
        };

        AddContactComponentVM.prototype.addContact = function () {
            console.log("Adding contact");
            ContactUtils.reinitContact(this.contact);
            $('#addContactModal').modal('show');
        };

        AddContactComponentVM.prototype.onSave = function () {
            AjaxUtils.post(
                '/contact',
                KOMap.toJSON(this.contact),
                function onSuccess(response) {
                    console.log('Saved Contact: ' + JSON.stringify(response));
                    this.contact._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Contact <b>' + response.data.name + '</b> saved'});

                    let contactJS = KOMap.toJS(this.contact);
                    ContactClient.updateInSession(contactJS);
                    amplify.publish(Events.ADDED_CONTACT, contactJS);
                    $('#addContactModal').modal('hide');
                }.bind(this),
                function onFail(response) {
                    console.log('Failure: ' + JSON.stringify(response));
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: response.message});
                }
            );
        };

        AddContactComponentVM.prototype.loadContact = function (contactId) {
            AjaxUtils.getJSON('/contact/' + contactId)
                .done(function (resp) {
                    console.log('Loaded contact ' + JSON.stringify(resp.data));
                    this.contact = ContactUtils.populateFromJSON(resp.data);
                    this.contacts([this.contact]);

                    $('#addContactModal').modal('show');
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load contact ' + JSON.stringify(resp));
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: '<strong>Server Error</strong> Problem while accessing contact information. Please retry.'});
                });
        };

        return {viewModel: AddContactComponentVM, template: viewHtml};
    });