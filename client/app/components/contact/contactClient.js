define(['jquery', 'amplify' ,'app/utils/session', 'app/utils/events', 'app/utils/ajaxUtils'],
    function ($, amplify, Session, Events, AjaxUtils) {

        return {
            loadContactsAndStoreInSession : function() {
                return AjaxUtils.getJSON('/contact')
                        .done(function (resp) {
                            if (resp.status !== 'Success') {
                                console.error('Failed to load contacts');
                            } else {
                                console.info('Loaded contacts' + JSON.stringify(resp.data).substr(0, 100));
                                Session.setContacts(resp.data);
                                amplify.publish(Events.INIT_CONTACTS_CACHE);
                            }
                        })
            },

            updateInSession : function(contactObj) {
                var contacts = Session.getContacts();
                var update = false;
                if ($.isEmptyObject(contactObj)
                    || contactObj._id === undefined
                    || contactObj._id === null) {
                    return;
                }
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