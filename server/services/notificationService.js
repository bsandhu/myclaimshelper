var sendResponse = require('./claimsService.js').sendResponse;
var EventEmitter = require('events').EventEmitter;
var Notification = require('../model/notification.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var dateUtils = require('./../shared/dateUtils.js');
var Consts = require('./../shared/consts.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');


function markAllAsRead(req, res) {
    console.log('Marking as msgs as read');
    markAllAsReadInDB()
        .then(_.partial(sendResponse, res, null, {}))
        .fail(_.partial(sendResponse, res, 'Failed to update', {}));
}

function getUnreadMsgs(req, res) {
    console.log('Get unread notifications');
    getUnreadinDB(5)
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to get unread msgs'));
}

function getUnreadMsgCount(req, res) {
    console.log('Get unread msg count');
    getUnreadMsgCountInDB()
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to get unread msg count'));
}

/****************************************************/
/* No Http Ops */
/****************************************************/

function broadcastNoHTTP(name, body) {
    var defer = jQuery.Deferred();

    var notification = new Notification();
    notification.name = name;
    notification.body = body;

    // Persist and broadcast
    // Broadcast event picked up by the start.js module
    saveNotificationInDB(notification)
        .then(function (entity) {
            serviceUtils.eventEmitter.emit('foo', entity);
        })
        .then(getUnreadMsgCountInDB)
        .then(function (count) {
            var msgCountNotification = new Notification();
            msgCountNotification.name = Consts.NotificationName.UNREAD_COUNT;
            msgCountNotification.body = count;

            serviceUtils.eventEmitter.emit('foo', msgCountNotification);
            defer.resolve(notification);
        })
        .fail(function (err) {
            console.log(err);
            defer.reject(err);
        });
    return defer;
}

function broadcast(req, res) {
    return broadcastNoHTTP(Consts.NotificationName.NEW_MSG, req.body.msg)
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to update'));
}

/****************************************************/
/* CRUD Ops */
/****************************************************/

function saveNotificationInDB(notification) {
    var defer = jQuery.Deferred();
    mongoUtils.saveOrUpdateEntity(notification, mongoUtils.NOTIFICATIONS_COL_NAME)
        .then(function (err, entity) {
            err ? defer.reject(err)
                : defer.resolve(entity)
        });
    return defer;
}

function getUnreadinDB(daysAgo) {
    var defer = jQuery.Deferred();
    mongoUtils.run(function find(db) {
        db.collection(mongoUtils.NOTIFICATIONS_COL_NAME)
            .find({
                $or: [
                    {lastUpdateDate: {$gt: dateUtils.daysBeforeNowInMillis(daysAgo)}},
                    {lastUpdateDate: { $exists: false }},
                ],
                read: false
            }).toArray(
            function onDone(err, result) {
                console.log('Unread messages: ' + result.length);
                Boolean(err) ? defer.reject(err) : defer.resolve(result);
            });
    });
    return defer;
}

function deleteNotificationInDB(notificationId) {
    var defer = jQuery.Deferred();
    jQuery
        .when(mongoUtils.deleteEntity({_id: notificationId}, mongoUtils.NOTIFICATIONS_COL_NAME))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function markAllAsReadInDB() {
    var defer = jQuery.Deferred();
    jQuery
        .when(mongoUtils.modifyAttr(mongoUtils.NOTIFICATIONS_COL_NAME, {"read": true}))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function getUnreadMsgCountInDB() {
    var defer = jQuery.Deferred();

    mongoUtils.run(function count(db) {
        db.collection(mongoUtils.NOTIFICATIONS_COL_NAME)
            .aggregate([
                { $match: { read: false} },
                { $group: { _id: "$read", count: { $sum: 1 } } }
            ],
            function onDone(err, resultsArray) {
                console.log('Unread msg count query result: ' + JSON.stringify(resultsArray));
                Boolean(err)
                    ? defer.reject(err)
                    : defer.resolve(resultsArray && resultsArray.length > 0
                    ? resultsArray[0].count
                    : 0);
            });
    });
    return defer;
}


exports.broadcast = broadcast;
exports.broadcastNoHTTP = broadcastNoHTTP;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadMsgs = getUnreadMsgs;
exports.getUnreadMsgCount = getUnreadMsgCount;

exports.markAllAsReadInDB = markAllAsReadInDB;
exports.getUnreadinDB = getUnreadinDB;
exports.deleteNotificationInDB = deleteNotificationInDB;
exports.getUnreadMsgCountInDB = getUnreadMsgCountInDB;
