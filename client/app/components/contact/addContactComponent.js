define(['knockout', 'KOMap', 'text!app/components/contact/addContactComponent.tmpl.html', 'model/contact',
        'app/utils/ajaxUtils', 'amplify', 'app/utils/events'],

    function (ko, KOMap, viewHtml, Contact, AjaxUtils, amplify, Events) {
        'use strict';

        function AddContactComponentVM(params) {
            console.log('Init Add Contact Widget');

            var contact = new Contact();
            contact.isBusiness = false;
            this.contact     = ko.observable(KOMap.fromJS(contact));

            this.setupEvListeners();
        }

        AddContactComponentVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CONTACT, this, this.onShowContact);
            amplify.subscribe(Events.ADD_CONTACT, this, this.onAddContact);
        };

        AddContactComponentVM.prototype.onShowContact = function (evData) {
            console.log('AddContactComponentVM - SHOW_CONTACT ev ' + JSON.stringify(evData));
            this.loadContact(evData.contactId);
        };

        AddContactComponentVM.prototype.onAddContact = function () {
            console.log('AddContactComponentVM - ADD_CONTACT ev ');
            this.addContact();
        };

        AddContactComponentVM.prototype.addContact = function(){
            console.log("Adding contact");
            for(var attr in this.contact()){
                if (ko.isObservable(this.contact()[attr])){
                    console.log('Clearing contact attr: ' + attr);
                    this.contact()[attr](null);
                }
            }
        };

        AddContactComponentVM.prototype.onSave = function(){
            AjaxUtils.post(
                '/contact',
                KOMap.toJSON(this.contact()),
                function onSuccess(response) {
                    console.log('Saved Contact: ' + JSON.stringify(response));
                    this.contact()._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: response.message});
                    amplify.publish(Events.ADDED_CONTACT, KOMap.toJS(this.contact()));
                }.bind(this),
                function onFail(response) {
                    console.log('Failure: ' + JSON.stringify(response));
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: response.message});
                }
            );
        };

        AddContactComponentVM.prototype.loadContact = function(contactId){
            $.getJSON('/contact/' + contactId)
                .done(function (resp) {
                    console.log('Loaded contact ' + JSON.stringify(resp.data));

                    // Populate with JSON data
                    KOMap.fromJS(resp.data[0], {}, this.contact());
                    $('#addContactModal').modal('show');
                }.bind(this))
                .fail(function(resp){
                    console.error('Failed to load contact ' + JSON.stringify(resp));
                });
        };

        return {viewModel: AddContactComponentVM, template: viewHtml};
    });