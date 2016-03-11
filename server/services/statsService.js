var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var dateUtils = require('./../shared/dateUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');
var assert = require('assert');


function aggregations(userid) {
    var sod = dateUtils.startOfToday().getTime();
    var eod = dateUtils.endOfToday().getTime();

    return {
        'TasksDoneToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {state: "Complete"}},
                {$match: {owner: userid}},
                {$group: {_id: "$state", total: {$sum: 1}}}
            ]},
        'TasksDueToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {owner: userid}},
                {$group: {_id: null, total: {$sum: 1}}}
            ]},
        'TaskByCategory': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {owner: userid}},
                {$match: {$or: [
                    {tag: { $eq: 'phone'}},
                    {tag: { $eq: 'visit'}},
                    {tag: { $eq: 'other'}},
                    {tag: { $eq: 'photos'}}
                ]}},
                {$group: {_id: "$tag", total: {$sum: 1}}}
            ]},
        'BillsByBillingStatus': {
            colName: mongoUtils.BILL_COL_NAME,
            query: [
                {$match: {owner: userid}},
                {$group: { _id: '$status', total: { $sum: '$total' }}}
            ]}
    };
}

/**
 * Load all the aggregation defined above
 */
var _getAllStats = function (userId) {
    var defer = jQuery.Deferred();
    var aggregationsByUser = aggregations(userId);
    var statsDefereds = _.values(_.mapObject(aggregationsByUser, _getStats));

    jQuery.when.apply(jQuery, statsDefereds)
        .then(function () {
            var results = arguments;
            var tags = _.keys(aggregationsByUser);
            var taggedResults = _.object(tags, results);
            console.log('Stats: ' + JSON.stringify(taggedResults));
            defer.resolve(taggedResults);
        });
    return defer;
}

/**
 * Call DB for the supplied 'aggregation'
 */
var _getStats = function (queryMetaData) {
    var defer = jQuery.Deferred();
    var tag = tag;
    mongoUtils.connect()
        .then(function (db) {
            var col = db.collection(queryMetaData.colName);
            col.aggregate(queryMetaData.query,
                function (err, result) {
                    err
                        ? defer.reject(err)
                        : defer.resolve(result);
                });
        })
    return defer;
}

// REST ------------------------------

function getAllStatsREST(req, res) {
    console.log("Get all stats");
    assert(req.headers.userid, 'Expecting req to carry userif header');

    _getAllStats(req.headers.userid)
        .done(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res));
}

exports.getAllStatsREST = getAllStatsREST;