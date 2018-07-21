define(['knockout', 'underscore', 'KOMap',
        'text-loader!app/components/contact/contactWidget.tmpl.html',
        'app/utils/session',
        'app/components/contact/contactClient',
        'app/components/contact/contactUtils',
        'amplify', 'app/utils/events'],
    function (ko, _, KOMap, view, Session, ContactClient, ContactUtils, amplify, Events) {

        function ContactWidgetVM() {
            console.log('Init Contacts Widget')
            this.ContactUtils = ContactUtils;
            this.contacts = ko.observableArray([]);
            this.filteredContacts = ko.observableArray([]);
            this.filterText = ko.observable();
            this.initFilter();

            this.panelContentHeight = $(window).height() - (100 + $('.navbar-brand').height());

            if (Session.getContacts().length === 0) {
                ContactClient
                    .loadContactsAndStoreInSession()
                    .done(this.initContacts.bind(this));
            } else {
                this.initContacts();
            }
            amplify.subscribe(Events.ADDED_CONTACT, this, this.onAddedContactEv);
        }

        ContactWidgetVM.prototype.initFilter = function () {
            this.filterText.subscribe(function (newVal) {
                this.filteredContacts($.grep(this.contacts(), function (contact) {
                    return contact.name.toUpperCase().indexOf(newVal.toUpperCase()) >= 0;
                }));
            }, this);
        }

        ContactWidgetVM.prototype.onClearFilterClick = function () {
            this.filterText('');
        }

        ContactWidgetVM.prototype.onAddedContactEv = function (contact) {
            // Note: Newly added contact is already in the Session
            this.initContacts();
        }

        ContactWidgetVM.prototype.onShowContact = function (contact) {
            amplify.publish(Events.SHOW_CONTACT, {contactId: contact._id});
        }

        ContactWidgetVM.prototype.onAddContact = function (contact) {
            amplify.publish(Events.ADD_CONTACT);
        }

        ContactWidgetVM.prototype.initContacts = function () {
            console.log('Reloading contacts from session');
            this.contacts(_.sortBy(Session.getContacts(), 'name'));
            this.filteredContacts(_.sortBy(Session.getContacts(), 'name'));
        }

        return {viewModel: ContactWidgetVM, template: view};
    });