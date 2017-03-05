let assert = require('assert')
let Bill = require('../model/bill.js');
let Claim = require("../model/claim.js");
let BillingItem = require('../model/billingItem.js');
let config = require('./../config.js');
let sendResponse = require('./claimsService.js').sendResponse;
let mongoUtils = require('./../mongoUtils.js');
let jQuery = require("jquery-deferred");
let _ = require('underscore');
let addOwnerInfo = mongoUtils.addOwnerInfo;

let BILL_COL_NAME = mongoUtils.BILL_COL_NAME;
let BILLING_ITEMS_COL_NAME = mongoUtils.BILLING_ITEMS_COL_NAME;
let CLAIMS_COL_NAME = mongoUtils.CLAIMS_COL_NAME;


// :: DB -> Obj
function _billsCollection(db) {
    return db.collection(mongoUtils.BILL_COL_NAME);
}

// :: f -> Dict -> [Obj]
// convert a dict into an Object with dot-accessible attributes
function _hydrate(type, objects) {
    let objs = _.isArray(objects) ? objects : [objects];
    let fn = function (obj) {
        return _.extend(new type(), obj)
    };
    let hydrated = _.map(objs, fn);
    return hydrated;
}

// :: Obj -> (obj, [Obj])
let _decomposeBill = function (obj) {
    let billingItems = obj.billingItems;
    delete obj.billingItems;
    return [obj, billingItems]
}

// :: [Obj] -> Promise
let _saveOrUpdateBillingItems = _.partial(mongoUtils.saveOrUpdateEntity, _, BILLING_ITEMS_COL_NAME);

// :: Dict -> DB -> Promise
let _getBills = function (search, db) {
    let result = jQuery.Deferred();
    jQuery
        .when(mongoUtils.findEntities(BILL_COL_NAME, search, db))
        .then(function (bills) {
            console.log('_getBills: ' + JSON.stringify(bills).substr(0, 100));
            result.resolve(_hydrate(Bill, bills));
        });
    return result;
}

// :: Dict -> DB -> Promise
let _getBillingItems = function (search, db) {
    let result = jQuery.Deferred();
    jQuery.when(mongoUtils.findEntities(BILLING_ITEMS_COL_NAME, search, db))
        .then(function (billingItems) {
            //console.log('_getBillingItems: ' + JSON.stringify(billingItems).substr(0, 100));
            result.resolve(_hydrate(BillingItem, billingItems));
        });
    return result;
}

let _getClaimsIgnoringOwnership = function (search, db) {
    let result = jQuery.Deferred();
    jQuery.when(mongoUtils.findEntities(CLAIMS_COL_NAME, search, db, false))
        .then(function (claims) {
            console.log('_getClaimsIgnoringOwnership: ' + JSON.stringify(claims).substr(0, 100));
            result.resolve(_hydrate(Claim, claims));
        });
    return result;
}

// :: Dict -> DB -> Promise
let getBillObjects = function (search, includeClosedClaims, db) {
    let result = jQuery.Deferred();

    jQuery
        .when(_getBills(search, db))
        .then(function (bills) {
            let promises = _.map(bills, _.partial(_populateBillingItems));
            let itemsDefer = jQuery.Deferred();
            jQuery
                .when.apply(jQuery, promises)
                .then(function () {
                    return itemsDefer.resolve(bills);
                });
            return itemsDefer;
        })
        .then(function populateClaimAttrs(bills) {
            let correspondingClaimIds = _.uniq(_.map(bills, function (bill) {
                return bill.claimId
            }));
            _getClaimsIgnoringOwnership({
                _id: {$in: correspondingClaimIds},
                owner: search.owner,
                group: search.group,
                ingroups: search.ingroups
            }, db)
                .then(function (claims) {
                    _.each(bills, function populateClaimDetails(bill) {
                        let correspondingClaim = _.find(claims, function (claim) {
                            return claim._id == bill.claimId
                        });
                        bill.isClaimClosed = correspondingClaim ? correspondingClaim.isClosed : false;
                        bill.claimDescription = correspondingClaim ? correspondingClaim.description : 'None';
                        bill.claimInsuranceCompanyFileNum = correspondingClaim ? (correspondingClaim.insuranceCompanyFileNum || '') : 'None';
                        bill.claimFileNum = correspondingClaim ? (correspondingClaim.fileNum || '') : 'None';
                        bill.claimInsuranceCompanyName = correspondingClaim ? (correspondingClaim.insuranceCompanyName || '') : 'None';
                    })
                    // Filter out closed claims
                    result.resolve(
                        _.filter(bills, function (bill) {
                            return (includeClosedClaims == false && bill.isClaimClosed == true)
                                ? false
                                : true;
                        }));
                });
        });

    function _populateBillingItems(bill) {
        let done = jQuery.Deferred();
        let itemSearch = {billId: bill._id, owner: search.owner, group: search.group, ingroups: search.ingroups};
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
    let db = mongoUtils.connect();
    let query = req.body.search;
    let includeClosedClaims = req.body.includeClosedClaims;
    query = addOwnerInfo(req, query);

    db.then(_.partial(getBillObjects, query, includeClosedClaims))
        .then(_.partial(sendResponse, res, null),
            _.partial(sendResponse, res, 'Failed to get Bill for query ' + query));
}

// :: Dict -> Dict -> None
function getBillingItemsREST(req, res) {
    assert.ok(req.params.search, 'Expecting BillId as a parameter');
    let db = mongoUtils.connect();
    let search = req.params.search;
    search = addOwnerInfo(req, search);

    db.then(_.partial(_getBillingItems, search))
        .then(_.partial(sendResponse, res, null),
            _.partial(sendResponse, res, 'Failed to get BillingItems  ' + req.params.search));
}

// :: Dict -> Dict -> None
function saveOrUpdateBillingItemsREST(req, res) {
    let items = req.body;
    assert.ok(_.isArray(items), 'Expecting BillingItems in an Array');

    if (items.length > 1) {
        // Add owner attr to items
        items = _.map(items, function (item) {
            item = addOwnerInfo(req, item);
            return item;
        });
        let promises = _.map(items, _saveOrUpdateBillingItems);
        jQuery.when.apply(jQuery, promises)
            .done(_done)
            .fail(_fail);
    } else {
        // If one item is being saved - return Generated id
        items[0] = addOwnerInfo(req, items[0]);
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
    let bill = req.body;
    bill = addOwnerInfo(req, bill);

    // Saved in a separate API call
    delete bill.billingItems;

    console.log('Scrub convenience attrs from bill');
    delete bill.isClaimClosed;
    delete bill.claimDescription;
    delete bill.claimInsuranceCompanyName;
    delete bill.claimInsuranceCompanyName;
    delete bill.claimFileNum;

    mongoUtils.saveOrUpdateEntity(bill, BILL_COL_NAME)
        .then(function () {
            sendResponse(res, null, bill)
        })
        .fail(_.partial(sendResponse, res, 'Failled to save ' + bill));
}


// REST
exports.getBillObjects = getBillObjects;
exports.getBillsREST = getBillsREST;
exports.getBillingItemsREST = getBillingItemsREST;
exports.saveOrUpdateBillingItemsREST = saveOrUpdateBillingItemsREST;
exports.saveOrUpdateBillREST = saveOrUpdateBillREST;

