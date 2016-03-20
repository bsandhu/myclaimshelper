var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var dateUtils = require('./../shared/dateUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');
var assert = require('assert');
var moment = require('moment');


function aggregations(userid) {
    var sod = dateUtils.startOfToday().getTime();
    var eod = dateUtils.endOfToday().getTime();

    return {
        'TasksDoneToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {state: "Complete"}},
                {$match: {owner: userid}},
                {$group: {_id: "$state", total: {$sum: 1}}}
            ]},
        'TasksDueToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {owner: userid}},
                {$group: {_id: null, total: {$sum: 1}}}
            ]},
        'TaskByCategory': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
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
            ]},
        'OpenClaims': {
            colName: mongoUtils.CLAIMS_COL_NAME,
            query: [
                {$match: {owner: userid}},
                {$match: {isClosed: false}},
                {$group: { _id: null, total: { $sum: 1 }}}
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

function _getClosedClaimsStats(userId) {
    console.log("Get closed claims stats");
    assert(userId, 'Expecting req to carry userif header');
    var defer = jQuery.Deferred();
    const LABEL = 'MMM YY';

    mongoUtils.connect()
        .then(function (db) {
            const search = {isClosed: true, owner: userId};

            mongoUtils.findEntities(mongoUtils.CLAIMS_COL_NAME, search, db)
                .then(function (closedClaims, err) {
                    if (err) {
                        defer.reject(err);
                        return;
                    }

                    // Filter out the dateClosed attribute
                    // --> [{dateClosed: 1457909494019}]
                    var closedClaims = _.map(closedClaims, function (claim) {
                        return {dateClosed: claim.dateClosed}
                    });

                    // --> { Unknown: [ 1457909494019 ] }
                    var groupedByDateClosed = _.groupBy(closedClaims, function (claim) {
                        return (_.has(claim, 'dateClosed') && claim.dateClosed)
                            ? moment(new Date(claim.dateClosed)).format(LABEL)
                            : 'Unknown';
                    });
                    console.log(groupedByDateClosed);

                    // --> { Unknown: 1 }
                    var countByDateClosed = _.mapObject(groupedByDateClosed, function (val, key) {
                        return val.length;
                    });

                    // Add 0 values for the last 3 minths so the graph doesnt look so empty
                    var lastMonth1 = moment(new Date()).subtract(1, 'months').format(LABEL);
                    var lastMonth2 = moment(new Date()).subtract(2, 'months').format(LABEL);
                    var lastMonth3 = moment(new Date()).subtract(3, 'months').format(LABEL);
                    var lastMonth1 = lastMonth1

                    !_.has(countByDateClosed, lastMonth1) ? countByDateClosed[lastMonth1] = 0.1 : _.noop();
                    !_.has(countByDateClosed, lastMonth2) ? countByDateClosed[lastMonth2] = 0.1 : _.noop();
                    !_.has(countByDateClosed, lastMonth3) ? countByDateClosed[lastMonth3] = 0.1 : _.noop();

                    console.log(countByDateClosed);
                    defer.resolve({'ClosedClaims': countByDateClosed});
                });
        });
    return defer;
}


// REST ------------------------------

function getAllStatsREST(req, res) {
    console.log("Get all stats");
    const owner = req.headers.userid;
    assert(owner, 'Expecting req to carry userif header');

    jQuery.when(_getAllStats(owner), _getClosedClaimsStats(owner))
        .then(function (taggedResults, closedClaimsData) {
            return _.extend(taggedResults, closedClaimsData);
        })
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res));
}


exports.getAllStatsREST = getAllStatsREST;
