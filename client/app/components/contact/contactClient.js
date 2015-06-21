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
            }
        };
    });