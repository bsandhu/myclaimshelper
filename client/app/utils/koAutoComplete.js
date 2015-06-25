define(['jquery', 'knockout', 'KOMap', 'app/utils/session', 'app/components/contact/contactClient'],

    function ($, ko, KOMap, Session, ContactClient) {
        'use strict';

        ko.bindingHandlers.autoComplete = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                if (Session.getContacts().length === 0) {
                    ContactClient.loadContactsAndStoreInSession().done(setupWidget);
                } else {
                    setupWidget();
                }

                function setupWidget() {
                    // Get the Contact that we're bound to
                    var accessor = valueAccessor();
                    var contactObservable = ko.unwrap(accessor);

                    var foo = $.map(Session.getContacts(), function (item) {
                        item.value = item.name;
                        item.label = item.name;
                        return item;
                    });

                    $(element).autocomplete({
                        minLength: 0,
                        source: foo,
                        select: function (event, ui) {
                            console.log("Selected: " + JSON.stringify(ui.item));
                            // Update Contact observable
                            var selectedContact = ui.item;
                            KOMap.fromJS(selectedContact, {}, contactObservable);
                            return true;
                        }
                    });
                }
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No op
            }
        }
    }
)