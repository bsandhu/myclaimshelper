let sendResponse = require('./claimsService.js').sendResponse;
let EventEmitter = require('events').EventEmitter;
let Notification = require('../model/notification.js');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let dateUtils = require('./../shared/dateUtils.js');
let Consts = require('./../shared/consts.js');
let jQuery = require('jquery-deferred');
let _ = require('underscore');
let assert = require('assert');


function markAllAsRead(req, res) {
    console.log('Marking as msgs as read');
    markAllAsReadInDB(req.headers.userid)
        .then(_.partial(sendResponse, res, null, {}))
        .fail(_.partial(sendResponse, res, 'Failed to update', {}));
}

function getUnreadMsgs(req, res) {
    console.log('Get unread notifications');
    getUnreadinDB(5, req.headers.userid)
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to get unread msgs'));
}

function getUnreadMsgCount(req, res) {
    console.log('Get unread msg count');
    getUnreadMsgCountInDB(req.headers.userid)
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to get unread msg count'));
}

/****************************************************/
/* No Http Ops */
/****************************************************/

function broadcastNoHTTP(name, type, body, owner, group) {
    assert(name,  'name must be specified');
    assert(type,  'type must be specified');
    assert(body,  'body must be specified');
    assert(owner, 'owner must be specified');
    let defer = jQuery.Deferred();

    let notification = new Notification();
    notification.name = name;
    notification.type = type;
    notification.owner = owner;
    notification.group = group;
    notification.body = body;

    // Persist and broadcast
    // Broadcast event picked up by the start.js module
    saveNotificationInDB(notification)
        .then(function (entity) {
            serviceUtils.eventEmitter.emit('foo', entity, owner);
        })
        .then(_.partial(getUnreadMsgCountInDB, owner))
        .then(function (count) {
            let msgCountNotification = new Notification();
            msgCountNotification.name = Consts.NotificationName.UNREAD_COUNT;
            msgCountNotification.body = count;

            serviceUtils.eventEmitter.emit('foo', msgCountNotification, owner);
            defer.resolve(notification);
        })
        .fail(function (err) {
            console.log(err);
            defer.reject(err);
        });
    return defer;
}

function broadcast(req, res) {
    assert(req.headers.userid);

    return broadcastNoHTTP(
                Consts.NotificationName.NEW_MSG,
                Consts.NotificationType.INFO,
                req.body.msg,
                req.headers.userid,
                req.headers.group)
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res, 'Failed to update'));
}

/****************************************************/
/* CRUD Ops */
/****************************************************/

function saveNotificationInDB(notification) {
    let defer = jQuery.Deferred();
    mongoUtils.saveOrUpdateEntity(notification, mongoUtils.NOTIFICATIONS_COL_NAME)
        .then(function (err, entity) {
            err ? defer.reject(err)
                : defer.resolve(entity)
        });
    return defer;
}

function getUnreadinDB(daysAgo, owner) {
    assert(daysAgo, 'daysAgo must be specified');
    assert(owner, 'Owner must be specified');

    let defer = jQuery.Deferred();
    mongoUtils.run(function find(db) {
        db.collection(mongoUtils.NOTIFICATIONS_COL_NAME)
            .find({
                owner: owner,
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
    let defer = jQuery.Deferred();
    jQuery
        .when(mongoUtils.deleteEntity({_id: notificationId}, mongoUtils.NOTIFICATIONS_COL_NAME))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function markAllAsReadInDB(owner) {
    assert(owner, 'Owner must be specified');
    let defer = jQuery.Deferred();
    jQuery
        .when(mongoUtils.modifyAttr(
                    mongoUtils.NOTIFICATIONS_COL_NAME,
                    {"read": true},
                    {owner: owner}))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function getUnreadMsgCountInDB(owner) {
    assert(owner, 'Owner must be specified');
    let defer = jQuery.Deferred();

    mongoUtils.run(function count(db) {
        db.collection(mongoUtils.NOTIFICATIONS_COL_NAME)
            .aggregate([
                { $match: { read: false, owner: owner }},
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
