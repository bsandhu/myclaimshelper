var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');


var aggregations = {
    'Tasks done today': [
        {$match: {state: "Complete"}},
        {$group: {_id: {state: "$state"}, total: {$sum: 1}}}
    ], 'Tasks due today': [
        {$match: {state: "Complete"}},
        {$group: {_id: {state: "$state"}, total: {$sum: 1}}}
    ]
}

var _getAllStats = function () {
    var defer = jQuery.Deferred();
    var statsDefereds = _.values(_.mapObject(aggregations, _getStats));
    jQuery.when.apply(jQuery, statsDefereds)
        .then(function () {
            var results = arguments;
            var tags = _.keys(aggregations);
            var taggedResults = _.object(tags, results);
            defer.resolve(taggedResults);
        });
    return defer;
}

var _getStats = function (query) {
    var defer = jQuery.Deferred();
    var tag = tag;
    mongoUtils.connect()
        .then(function (db) {
            var col = db.collection(mongoUtils.CLAIM_ENTRIES_COL_NAME);
            col.aggregate(query,
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
    _getAllStats()
        .done(_.partial(sendResponse, res, null))
        .fail(_.partial(sendResponse, res));
}

exports.getAllStatsREST = getAllStatsREST;