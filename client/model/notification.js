define(['./../shared/consts'], function (consts) {

    function Notification() {
        this._id = undefined;

        this.name = consts.NotificationName.NEW_MSG;
        this.type = consts.NotificationType.INFO;
        this.read = false;
        this.summary = '';
        this.body = '';
        this.data = {};

        this.lastUpdateDate = new Date().getTime();
    }

    return Notification;
});