// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([], function () {

    return {
        Events: {
            NOTIFICATION: "Notification"
        },
        NotificationType: {
            INFO: "Info",
            ERROR: "danger"
        },
        NotificationName: {
            'NEW_MSG': "NewMsg",
            'UNREAD_COUNT': "UnreadMsgCount"
        },
        CONTACT_CATEGORY_OTHER: "Other",

        CONTACT_CATEGORY_INSURED: "Insured",
        CONTACT_CATEGORY_INSURED_ATTY: "Insured attorney",
        CONTACT_SUBCATEGORY_INSURED: "Insured",

        CONTACT_CATEGORY_CLAIMANT: "Claimant",
        CONTACT_CATEGORY_CLAIMANT_ATTY: "Claimant attorney",
        CONTACT_SUBCATEGORY_CLAIMANT: "Claimant"
    }
});
