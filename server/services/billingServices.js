var assert = require('assert')
var Bill = require('../model/bill.js');
var BillingItem = require('../model/billingItem.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');

// TODO: remove duplicate code.

// :: DB -> Obj
function _billsCollection(db) {
  return db.collection(mongoUtils.BILL_COL_NAME);
}

// :: f -> Dict -> Obj
// convert a dict into an Object with dot-accessible attributes
function _hydrate(type, dict){
  return _.extend(new type(), dict);
}

// :: Obj -> (obj, [Obj])
var _decomposeBill = function(obj){
  var billingItems = obj.billingObjects;
  delete obj.billingObjects;
  return [obj, billingItems]
}

// :: [Obj] -> Promise
var _saveOrUpdateBillingItems = _.partial(mongoUtils.saveOrUpdateEntity, 
                                         _, 
                                         'billingItems');
// :: Obj -> Promse
var _saveOrUpdateBill = _.partial(mongoUtils.saveOrUpdateEntity, _, 'bills');

// :: Obj -> DB -> Promise
var saveBillObject = function(obj, db){
  var result  = jQuery.Deferred();
  var parts   = _decomposeBill(obj);
  var promises= _.map(parts[1], _saveOrUpdateBillingItems);
  promises.push(_saveOrUpdateBill(parts[0]));
  jQuery.when.apply(null, promises)
    .done(function(){
      result.resolve(arguments);
    });
  return result;
}

// :: String -> DB -> Promise
var _getBill = function(id, db){
  return mongoUtils.findEntities('bills', {_id:id}, db);
}

// :: String -> DB -> Promise
var _getBillItems = function(id, db){
  return mongoUtils.findEntities('billingItems', {billId:id}, db);
}

// :: String -> DB -> Promise
var getBillObject = function(id, db){
  var result = jQuery.Deferred();

  var _constructBill = function(bills, billingItems){
    var bill = _hydrate(Bill, bills[0]);
    bill.billingObjects = _.map(billingItems, _.partial(_hydrate, BillingItem));
    result.resolve(bill);
  };

  jQuery.when(_getBill(id, db), _getBillItems(id, db))
        .then(_constructBill);
  return result;
}


// REST services ----------------------
function getAllBills(req, res) {
    console.log('Get all Bills');

    mongoUtils.run(function (db) {
        _billsCollection(db).find().toArray(_onResults);
        
        function _onResults(err, items) {
            var modelObjs = _.map(items, _.partial(_hydrate, Bill));
            sendResponse(res, err, modelObjs);
        }

    });
}

function getBill(req, res){
    assert.ok(req.params.id, 'Expecting BillId as a parameter');
    var query = {'_id': req.params.id};
    var options = {};

    mongoUtils.run(function (db) {
        _billsCollection(db)
            .find(query, options)
            .toArray(_onResults);

        function _onResults(err, items) {
            var modelObjs = _.map(items, _hydrate.bind(null, Bill));
            sendResponse(res, err, modelObjs);
        }
    });
}

function saveOrUpdateBill(req, res) {
    var bill = req.body;
    mongoUtils.saveOrUpdateEntity(bill, mongoUtils.BILL_COL_NAME)
        .always(function (err, results) {
            sendResponse(res, err, results);
        });
}


// NOTE this should probably be on the client
//function computeTotals(bill, billingProfile){
  //var billingItems = getBillingItems(bill);
  //var mileage = 0;
  //for (var i=0; billingItems.length; i++){
    //mileage += billingItems[i].mileage;
  //}

//};


exports.getBill = getBill;
exports.getAllBills = getAllBills;
exports.saveOrUpdateBill = saveOrUpdateBill;

exports.saveBillObject = saveBillObject;
exports.getBillObject = getBillObject;
