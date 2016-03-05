var assert = require('assert')
var Bill = require('../model/bill.js');
var Claim = require("../model/claim.js");
var BillingItem = require('../model/billingItem.js');
var config = require('./../config.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');

var BILL_COL_NAME = mongoUtils.BILL_COL_NAME;
var BILLING_ITEMS_COL_NAME = mongoUtils.BILLING_ITEMS_COL_NAME;
var CLAIMS_COL_NAME = mongoUtils.CLAIMS_COL_NAME;


// :: DB -> Obj
function _billsCollection(db) {
    return db.collection(mongoUtils.BILL_COL_NAME);
}

// :: f -> Dict -> [Obj]
// convert a dict into an Object with dot-accessible attributes
function _hydrate(type, objects) {
    var objs = _.isArray(objects) ? objects : [objects];
    var fn = function (obj) {
        return _.extend(new type(), obj)
    };
    var hydrated = _.map(objs, fn);
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

// :: Dict -> DB -> Promise
var _getBills = function (search, db) {
    var result = jQuery.Deferred();
    jQuery
        .when(mongoUtils.findEntities(BILL_COL_NAME, search, db))
        .then(function (bills) {
            console.log('_getBills: ' + JSON.stringify(bills).substr(0, 100));
            result.resolve(_hydrate(Bill, bills));
        });
    return result;
}

// :: Dict -> DB -> Promise
var _getBillingItems = function (search, db) {
    var result = jQuery.Deferred();
    jQuery.when(mongoUtils.findEntities(BILLING_ITEMS_COL_NAME, search, db))
        .then(function (billingItems) {
            console.log('_getBillingItems: ' + JSON.stringify(billingItems).substr(0, 100));
            result.resolve(_hydrate(BillingItem, billingItems));
        });
    return result;
}

var _getClaimsIgnoringOwnership = function (search, db) {
    var result = jQuery.Deferred();
    jQuery.when(mongoUtils.findEntities(CLAIMS_COL_NAME, search, db, false))
        .then(function (claims) {
            console.log('_getClaimsIgnoringOwnership: ' + JSON.stringify(claims).substr(0, 100));
            result.resolve(_hydrate(Claim, claims));
        });
    return result;
}

// :: Dict -> DB -> Promise
var getBillObjects = function (search, db) {
    var result = jQuery.Deferred();

    jQuery
        .when(_getBills(search, db))
        .then(function (bills) {
            var promises = _.map(bills, _.partial(_populateBillingItems));
            var itemsDefer = jQuery.Deferred();
            jQuery
                .when.apply(jQuery, promises)
                .then(function () {
                    return itemsDefer.resolve(bills);
                });
            return itemsDefer;
        })
        .then(function populateClaimAttrs(bills) {
            var correspondingClaimIds = _.uniq(_.map(bills, function (bill) {
                return bill.claimId
            }));
            _getClaimsIgnoringOwnership({_id: {$in: correspondingClaimIds}}, db)
                .then(function (claims) {
                    _.each(bills, function populateClaimDetails(bill) {
                        var correspondingClaim = _.find(claims, function (claim) {
                            return claim._id == bill.claimId
                        });
                        bill.isClaimClosed = correspondingClaim ? correspondingClaim.isClosed : false;
                        bill.claimDescription = correspondingClaim ? correspondingClaim.description : 'None';
                        bill.claimInsuranceCompanyFileNum = correspondingClaim ? correspondingClaim.insuranceCompanyFileNum : 'None';
                        bill.claimInsuranceCompanyName = correspondingClaim ? correspondingClaim.insuranceCompanyName : 'None';
                    })
                    result.resolve(bills);
                });
        });

    function _populateBillingItems(bill) {
        var done = jQuery.Deferred();
        var itemSearch = {billId: bill._id, owner: bill.owner};
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
    var db = mongoUtils.connect();
    var query = req.body;
    query.owner = req.headers.userid;

    db.then(_.partial(getBillObjects, query))
        .then(_.partial(sendResponse, res, null),
        _.partial(sendResponse, res, 'Failed to get Bill for query ' + query));
}

// :: Dict -> Dict -> None
function getBillingItemsREST(req, res) {
    assert.ok(req.params.search, 'Expecting BillId as a parameter');
    var db = mongoUtils.connect();
    var search = req.params.search;
    search.owner = req.headers.userid;

    db.then(_.partial(_getBillingItems, search))
        .then(_.partial(sendResponse, res, null),
        _.partial(sendResponse, res, 'Failed to get BillingItems  ' + req.params.search));
}

// :: Dict -> Dict -> None
function saveOrUpdateBillingItemsREST(req, res) {
    var items = req.body;
    assert.ok(_.isArray(items), 'Expecting BillingItems in an Array');

    if (items.length > 1) {
        // Add owner attr to items
        items = _.map(items, function (item) {
            item.owner = req.headers.userid;
        });
        var promises = _.map(items, _saveOrUpdateBillingItems);
        jQuery.when.apply(jQuery, promises)
            .done(_done)
            .fail(_fail);
    } else {
        // If one item is being saved - return Generated id
        items[0].owner = req.headers.userid;
        mongoUtils.saveOrUpdateEntity(items[0], mongoUtils.BILLING_ITEMS_COL_NAME)
            .always(function (err, results) {
                sendResponse(res, err, results);
            });
    }

    function _done(msg) {
        sendResponse(res, null, msg);
    };
    function _fail() {
        sendResponse(res, 'Failed to save');
    };
}

// :: Dict -> Dict -> None
function saveOrUpdateBillREST(req, res) {
    var bill = req.body;
    bill.owner = req.headers.userid;

    delete bill.billingItems;

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

