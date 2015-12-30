var assert = require('assert');
var notificationService = require('./../../server/services/notificationService.js');
var Notification = require('./../../server/model/notification.js');
var mongoUtils = require('./../../server/mongoUtils.js');
var _ = require('underscore');


describe('NotificationService', function () {
    var testNotification = new Notification();
    testNotification.name = undefined;
    testNotification.type = 'info';
    testNotification.read = false;
    testNotification.summary = '';
    testNotification.body = '';
    testNotification.data = {};

    after(function (done) {
        assert.ok(testNotification._id);
        notificationService
            .deleteNotificationInDB(testNotification._id)
            .done(done)
            .fail('Failed to cleanup notification test data');
    });

    it('Add Notification', function (done) {
        var req = {body: testNotification};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            var notification = data.data;
            assert.ok(notification._id);
            testNotification._id = notification._id;
        };

        notificationService.broadcast(req, res)
            .then(function () {
                done();
            });
    });

    it('Get unread Notification', function (done) {
        notificationService.getUnreadinDB(5)
            .then(function (err, result) {
                assert.equal(null, err);
                assert.ok(_.isArray(result));
            })
            .then(done);
    });

    it('Mark all as read', function (done) {
        notificationService.markAllAsReadInDB()
            .then(function () {
                mongoUtils.getEntityById(testNotification._id, mongoUtils.NOTIFICATIONS_COL_NAME)
                    .then(function (err, item) {
                        assert.equal(item.read, true);
                    })
                    .then(done);
            })
    });

    it('Unread count', function (done) {
        notificationService.unreadMsgCountInDB()
            .then(function (err, result) {
                assert.equal(null, err);
                assert.equal(result, 0);
            })
            .then(done);
    });
});