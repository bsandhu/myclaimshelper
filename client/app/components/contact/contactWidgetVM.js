define(['knockout', 'text!app/components/contact/contactWidget.tmpl.html',
        'app/utils/session', 'app/components/contact/contactClient', 'amplify', 'app/utils/events'],
    function (ko, view, Session, ContactClient, amplify, Events) {

        function ContactWidgetVM() {
            console.log('Init Contacts Widget');
            this.contacts = ko.observableArray([]);
            this.filteredContacts = ko.observableArray([]);
            this.filterText = ko.observable();
            this.initFilter();

            if (Session.getContacts().length === 0) {
                ContactClient.loadContactsAndStoreInSession().done(this.initContacts.bind(this));
            } else {
                this.initContacts();
            }
        }

        ContactWidgetVM.prototype.initFilter = function () {
            this.filterText.subscribe(function (newVal){
                this.filteredContacts($.grep(this.contacts(), function(contact){
                    return contact.name.toUpperCase().indexOf(newVal.toUpperCase()) >= 0;
                }));
            }, this);
        }

        ContactWidgetVM.prototype.onShowContact = function (contact) {
            amplify.publish(Events.SHOW_CONTACT, {contactId: contact._id});
        }

        ContactWidgetVM.prototype.onAddContact = function (contact) {
            amplify.publish(Events.ADD_CONTACT);
        }

        ContactWidgetVM.prototype.initContacts = function () {
            this.contacts(Session.getContacts());
            this.filteredContacts(Session.getContacts());
        }

        return {viewModel: ContactWidgetVM, template: view};
    });