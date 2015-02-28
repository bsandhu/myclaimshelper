var assert = require('assert')
var Bill = require('../model/bill.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');

// TODO: remove duplicate code.

function _billsCollection(db) {
  return db.collection(mongoUtils.BILL_COL_NAME);
}

function _hydrate(type, dict){
  return _.extend(new type(), dict);
}

// :: String -> DB -> Promise
var getBillObject = function(id, db){
  var result = jQuery.Deferred();
  jQuery.when(mongoUtils.findEntries('bills', {_id:id}, db),
              mongoUtils.findEntries('billingItems', {billId:id}, db))
        .then(function(items){result.resolve(items)});
  return result;
}

var _decomposeBill = function(obj){
  var billingItems = obj.billingObjects;
  delete obj.billingObjects;
  return [obj, billingItems]
}

var saveOrUpdateBillingItems = _.partial(mongoUtils.saveOrUpdateEntity, 
                                         _, 
                                         'billingItems');

var saveOrUpdateBill = _.partial(mongoUtils.saveOrUpdateEntity, _, 'bill');

// :: Obj -> DB -> Promise
var saveBillObject = function(obj, db){
  var result  = jQuery.Deferred();
  var parts   = _decomposeBill(obj);
  var promises= _.map(parts[1], saveOrUpdateBillingItems);
  promises.push(saveOrUpdateBill(parts[0]));
  jQuery.when.apply(null, promises)
    .done(function(){
      result.resolve(arguments);
    });
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
