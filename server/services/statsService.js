let sendResponse = require('./claimsService.js').sendResponse;
let mongoUtils = require('./../mongoUtils.js');
let dateUtils = require('./../shared/dateUtils.js');
let jQuery = require("jquery-deferred");
let _ = require('underscore');
let assert = require('assert');
let moment = require('moment');
let addOwnerInfo = mongoUtils.addOwnerInfo;


function aggregations(owner, ingroups) {
    let sod = dateUtils.startOfToday().getTime() - 1;
    let eod = dateUtils.endOfToday().getTime();

    return {
        'TasksDoneToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {state: "Complete"}},
                {$match: {'$or': [{'owner': owner}, {'group': {$in: ingroups}}] }},
                {$group: {_id: "$state", total: {$sum: 1}}}
            ]},
        'TasksDueToday': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {'$or': [{'owner': owner}, {'group': {$in: ingroups}}] }},
                {$group: {_id: null, total: {$sum: 1}}}
            ]},
        'TaskByCategory': {
            colName: mongoUtils.CLAIM_ENTRIES_COL_NAME,
            query: [
                {$match: {isClosed: false }},
                {$match: {dueDate: { $gt: sod} }},
                {$match: {dueDate: { $lt: eod} }},
                {$match: {'$or': [{'owner': owner}, {'group': {$in: ingroups}}] }},
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
                {$match: {'$or': [{'owner': owner}, {'group': {$in: ingroups}}] }},
                {$group: { _id: '$status', total: { $sum: '$total' }}}
            ]},
        'OpenClaims': {
            colName: mongoUtils.CLAIMS_COL_NAME,
            query: [
                {$match: {'$or': [{'owner': owner}, {'group': {$in: ingroups}}] }},
                {$match: {isClosed: false}},
                {$group: { _id: null, total: { $sum: 1 }}}
            ]}
    };
}

/**
 * Load all the aggregation defined above
 */
let _getAllStats = function (owner, ingroups) {
    let defer = jQuery.Deferred();
    let aggregationsByUser = aggregations(owner, ingroups);
    let statsDefereds = _.values(_.mapObject(aggregationsByUser, _getStats));

    jQuery.when.apply(jQuery, statsDefereds)
        .then(function () {
            let results = arguments;
            let tags = _.keys(aggregationsByUser);
            let taggedResults = _.object(tags, results);
            console.log('Stats: ' + JSON.stringify(taggedResults));
            defer.resolve(taggedResults);
        });
    return defer;
}

/**
 * Call DB for the supplied 'aggregation'
 */
let _getStats = function (queryMetaData) {
    let defer = jQuery.Deferred();
    mongoUtils.connect()
        .then(function (db) {
            let col = db.collection(queryMetaData.colName);
            col.aggregate(queryMetaData.query,
                function (err, result) {
                    err
                        ? defer.reject(err)
                        : defer.resolve(result);
                });
        })
    return defer;
}

function _getClosedClaimsStats(owner, ingroups) {
    console.log("Get closed claims stats");
    let defer = jQuery.Deferred();
    const LABEL = 'MMM YY';

    mongoUtils.connect()
        .then(function (db) {
            let search = {isClosed: true, owner: owner, ingroups: ingroups};

            mongoUtils.findEntities(mongoUtils.CLAIMS_COL_NAME, search, db)
                .then(function (closedClaims, err) {
                    if (err) {
                        defer.reject(err);
                        return;
                    }

                    // Filter out the dateClosed attribute
                    // --> [{dateClosed: 1457909494019}]
                    closedClaims = _.map(closedClaims, function (claim) {
                        return {dateClosed: claim.dateClosed}
                    });

                    // --> { Unknown: [ 1457909494019 ] }
                    let groupedByDateClosed = _.groupBy(closedClaims, function (claim) {
                        return (_.has(claim, 'dateClosed') && claim.dateClosed)
                            ? moment(new Date(claim.dateClosed)).format(LABEL)
                            : 'Unknown';
                    });
                    console.log(groupedByDateClosed);

                    // --> { Unknown: 1 }
                    let countByDateClosed = _.mapObject(groupedByDateClosed, function (val, key) {
                        return val.length;
                    });

                    // Add 0 values for the last 3 months so the graph doesnt look so empty
                    let lastMonth1 = moment(new Date()).subtract(1, 'months').format(LABEL);
                    let lastMonth2 = moment(new Date()).subtract(2, 'months').format(LABEL);
                    let lastMonth3 = moment(new Date()).subtract(3, 'months').format(LABEL);

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
    let ownerInfo = {};
    addOwnerInfo(req, ownerInfo);

    jQuery.when(
        _getAllStats(ownerInfo.owner, ownerInfo.ingroups),
        _getClosedClaimsStats(ownerInfo.owner, ownerInfo.ingroups))
        .then(function (taggedResults, closedClaimsData) {
            return _.extend(taggedResults, closedClaimsData);
        })
        .then(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res));
}


exports.getAllStatsREST = getAllStatsREST;
