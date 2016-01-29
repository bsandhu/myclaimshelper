var sendResponse = require('./claimsService.js').sendResponse;
var EventEmitter = require('events').EventEmitter;
var Notification = require('../model/notification.js');
var consts = require('../model/consts.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var dateUtils = require('./../shared/dateUtils.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');


function broadcastNoHTTP(msg){
  var notification = new Notification();
  notification.name = 'NewMsg';
  notification.body = msg;
  var defer = jQuery.Deferred();
  // Persist and broadcast
  // Broadcast event picked up by the start.js module
  mongoUtils.saveOrUpdateEntity(notification, mongoUtils.NOTIFICATIONS_COL_NAME)
    .then(function (err, entity) {
      if (err) {defer.reject()}
      else {
        serviceUtils.eventEmitter.emit('foo', entity);
        console.log("Broadcast 'foo' event emited")
        defer.resolve();
      }
    });
  return defer;
}

function broadcast(req, res) {
    var msg = req.body.msg;
    var notification = new Notification();
    notification.name = 'NewMsg';
    notification.body = msg;
    var defer = jQuery.Deferred();
    // Persist and broadcast
    // Broadcast event picked up by the start.js module
    mongoUtils.saveOrUpdateEntity(notification, mongoUtils.NOTIFICATIONS_COL_NAME)
        .then(function (err, entity) {
            sendResponse(res, err, entity);
            serviceUtils.eventEmitter.emit('foo', entity);
            defer.resolve();
        });
    return defer;
}

function markAllAsRead(req, res) {
    console.log('Marking as msgs as read');
    markAllAsReadInDB()
        .then(_.partial(sendResponse, res, null, {}))
        .fail(_.partial(sendResponse, res, 'Failed to update', {}));
}

function getUnreadMsgs(req, res) {
    console.log('Get unread notifications');
    getUnreadinDB(5)
        .then(function (err, result) {
            sendResponse(res, err, result);
        })
}

function getUnreadMsgCount(req, res) {
    console.log('Get unread msg count');
    getUnreadMsgCountInDB()
        .then(function (err, result) {
            sendResponse(res, err, result);
        })
}

/****************************************************/
/* CRUD Ops */
/****************************************************/

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
                defer.resolve(err, result);
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
                defer.resolve(err, resultsArray && resultsArray.length > 0 ? resultsArray[0].count : 0);
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
