let assert = require('assert');
let notificationService = require('./../../server/services/notificationService.js');
let Notification = require('./../../server/model/notification.js');
let mongoUtils = require('./../../server/mongoUtils.js');
let _ = require('underscore');


describe('NotificationService', function () {
    let testNotification = new Notification();
    testNotification.name = undefined;
    testNotification.type = 'info';
    testNotification.read = false;
    testNotification.summary = '';
    testNotification.body = 'Test body';
    testNotification.data = {};

    after(function (done) {
        assert.ok(testNotification._id);
        notificationService
            .deleteNotificationInDB(testNotification._id)
            .done(done)
            .fail('Failed to cleanup notification test data');
    });

    it('Add Notification', function (done) {
        let req = {body: {msg: 'Hello'}, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let notification = data.data;
            assert.ok(notification._id);
            assert.ok(notification.owner);
            testNotification._id = notification._id;
        };

        notificationService.broadcast(req, res)
            .then(function () {
                done();
            });
    });

    it('Get unread Notification', function (done) {
        notificationService.getUnreadinDB(5, 'TestUser')
            .then(function (result) {
                assert.ok(_.isArray(result));
            })
            .then(done);
    });

    it('Mark all as read', function (done) {
        notificationService.markAllAsReadInDB('TestUser')
            .then(function () {
                mongoUtils.getEntityById(testNotification._id, mongoUtils.NOTIFICATIONS_COL_NAME, 'TestUser', ['TestUser'])
                    .then(function (err, item) {
                        assert.equal(err, null);
                    })
                    .then(done);
            })
    });

    it('Unread count', function (done) {
        notificationService.getUnreadMsgCountInDB('TestUser')
            .then(function (result) {
                assert.equal(result, 0);
            })
            .then(done);
    });
});