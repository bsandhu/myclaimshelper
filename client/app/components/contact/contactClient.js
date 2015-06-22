define(['jquery', 'app/utils/session'],
    function ($, Session) {

        return {
            loadContactsAndStoreInSession : function() {
                return $.getJSON('/contact')
                        .done(function (resp) {
                            if (resp.status !== 'Success') {
                                console.error('Failed to load contacts');
                            } else {
                                console.log('Loaded contacts' + JSON.stringify(resp.data));
                                Session.setContacts(resp.data)
                            }
                        })
            },

            updateInSession : function(contactObj) {
                var contacts = Session.getContacts();
                var update = false;

                var newList = $.map(contacts, function (contact) {
                    if (contact._id === contactObj._id) {
                        update = true;
                        return contactObj;
                    } else {
                        return contact;
                    }
                });
                if (!update) {
                    newList.push(contactObj);
                }
                Session.setContacts(newList);
            }
        };
    });