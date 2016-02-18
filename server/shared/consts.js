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
            ERROR: "Error"
        },
        NotificationName: {
            'NEW_MSG': "NewMsg",
            'UNREAD_COUNT': "UnreadMsgCount"
        }
    }
});
