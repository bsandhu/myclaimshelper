var assert = require('assert')
var Bill = require('../model/bill.js');
var BillingItem = require('../model/billingItem.js');
var config = require('./../config.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');
var BILL_COL_NAME = mongoUtils.BILL_COL_NAME;
var BILLING_ITEMS_COL_NAME = mongoUtils.BILLING_ITEMS_COL_NAME;


// :: DB -> Obj
function _billsCollection(db) {
    return db.collection(mongoUtils.BILL_COL_NAME);
}

// :: f -> Dict -> [Obj]
// convert a dict into an Object with dot-accessible attributes
function _hydrate(type, objects) {
    console.info('Hydrating ' + type.name);
    var objs = _.isArray(objects) ? objects : [objects];
    var fn = function (obj) {
        return _.extend(new type(), obj)
    };
    var hydrated = _.map(objs, fn);
    console.info('Hydrated: ' + JSON.stringify(hydrated));
    return hydrated;
}

// :: Obj -> (obj, [Obj])
var _decomposeBill = function (obj) {
    var billingItems = obj.billingItems;
    delete obj.billingItems;
    return [obj, billingItems]
}

// :: [Obj] -> Promise
var _saveOrUpdateBillingItems = _.partial(mongoUtils.saveOrUpdateEntity, _, BILLING_ITEMS_COL_NAME);

// :: Obj -> Promse
var _saveOrUpdateBill = _.partial(mongoUtils.saveOrUpdateEntity, _, BILL_COL_NAME);

// :: String -> DB -> Promise
var _getBills = function (search, db) {
    var result = jQuery.Deferred();
    jQuery
        .when(mongoUtils.findEntities(BILL_COL_NAME, search, db))
        .then(function (bills) {
            console.log('_getBills: ' + JSON.stringify(bills));
            result.resolve(_hydrate(Bill, bills));
        });
    return result;
}

// :: Dict -> DB -> Promise
var _getBillingItems = function (search, db) {
    var result = jQuery.Deferred();
    jQuery.when(mongoUtils.findEntities(BILLING_ITEMS_COL_NAME, search, db))
        .then(function (billingItems) {
            console.log('_getBillingItems: ' + JSON.stringify(billingItems));
            result.resolve(_hydrate(BillingItem, billingItems));
        });
    return result;
}

// :: String -> DB -> Promise
var getBillObjects = function (search, db) {
    var result = jQuery.Deferred();

    jQuery
        .when(_getBills(search, db))
        .then(function (bills) {
            var promises = _.map(bills, _.partial(_populateBillingItems));
            jQuery
                .when.apply(jQuery, promises)
                .then(function () {
                    result.resolve(bills);
                });
        });

    function _populateBillingItems(bill){
        var done = jQuery.Deferred();
        var itemSearch = {billId: bill._id};
        jQuery.when(_getBillingItems(itemSearch, db))
            .then(function (billingItems) {
                bill.billingItems = billingItems;
                done.resolve();
            });
        return done;
    }
    return result;
}

// REST services --------------------------------------------------
// :: Dict -> Dict -> None
function getBillsREST(req, res) {
    assert.ok(req.body, 'Expecting Mongo query as a parameter');
    var query = req.body;
    var db = mongoUtils.connect(config.db);
    db.then(_.partial(getBillObjects, query))
        .then(_.partial(sendResponse, res, null),
        _.partial(sendResponse, res, 'Failed to get Bill for query ' + query));
}

// :: Dict -> Dict -> None
function getBillingItemsREST(req, res) {
    assert.ok(req.params.search, 'Expecting BillId as a parameter');
    //var search = {claimEntryId: req.params.id};
    var db = mongoUtils.connect(config.db);
    db.then(_.partial(_getBillingItems, req.params.search))
        .then(_.partial(sendResponse, res, null),
        _.partial(sendResponse, res, 'Failed to get BillingItems  ' + req.params.id));
}

// :: Dict -> Dict -> None
function saveOrUpdateBillingItemsREST(req, res) {
    function _done() {
        sendResponse(res, null, 'Success saving ');
    };
    function _fail() {
        sendResponse(res, 'Failed to save');
    };
    var items = req.body;
    var promises = _.map(items, _saveOrUpdateBillingItems);
    jQuery.when.apply(null, promises)
        .done(_done)
        .fail(_fail);
}

// :: Dict -> Dict -> None
function saveOrUpdateBillREST(req, res) {
    var bill = req.body;
    _saveOrUpdateBill(bill)
        .then(function () {
            sendResponse(res, null, bill)
        },
        _.partial(sendResponse, res, 'Failled to save ' + bill));
}


// REST
exports.getBillObjects = getBillObjects;
exports.getBillsREST = getBillsREST;
exports.getBillingItemsREST = getBillingItemsREST;
exports.saveOrUpdateBillingItemsREST = saveOrUpdateBillingItemsREST;
exports.saveOrUpdateBillREST = saveOrUpdateBillREST;

