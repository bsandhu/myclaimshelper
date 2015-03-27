var assert = require('assert')
var Bill = require('../model/bill.js');
var BillingItem = require('../model/billingItem.js');
var config = require('./../config.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');


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
//var saveBillObject = function(obj, db){
  //var result  = jQuery.Deferred();
  //var parts   = _decomposeBill(obj);
  //var promises= _.map(parts[1], _saveOrUpdateBillingItems);
  //promises.push(_saveOrUpdateBill(parts[0]));
  //jQuery.when.apply(null, promises)
    //.done(function(){
      //result.resolve(arguments);
    //});
  //return result;
//}

// :: String -> DB -> Promise
var _getBill = function(id, db){
  return mongoUtils.findEntities('bills', {_id:id}, db);
}

// :: Dict -> DB -> Promise
var _getBillingItems = function(search, db){
  return mongoUtils.findEntities('billingItems', search, db);
}

// :: String -> DB -> Promise
var getBillObject = function(id, db){
  var result = jQuery.Deferred();

  var _constructBill = function(bills, billingItems){
    var bill = _hydrate(Bill, bills[0]);
    bill.billingObjects = _.map(billingItems, _.partial(_hydrate, BillingItem));
    result.resolve(bill);
  };

  jQuery.when(_getBill(id, db), _getBillingItems({billId:id}, db))
        .then(_constructBill);
  return result;
}


// REST services ----------------------
// :: Dict -> Dict -> None
function getBillREST(req, res){
    assert.ok(req.params.id, 'Expecting BillId as a parameter');
    var db = mongoUtils.connect(config.db);
    db.then(_.partial(getBillObject, req.params.id))
      .then(_.partial(sendResponse, res, null), 
            _.partial(sendResponse, res, 'Failed to get Bill ' + req.params.id));
}

// :: Dict -> Dict -> None
function saveOrUpdateBillingItemsREST(req, res){
  function _done(){
    sendResponse(res, null, 'Success saving ');
  };
  function _fail(){
    sendResponse(res, 'Failed to save');
  };
  var items = req.body;
  var promises= _.map(items, _saveOrUpdateBillingItems);
  jQuery.when.apply(null, promises)
    .done(_done)
    .fail(_fail);
}

// :: Dict -> Dict -> None
//function saveOrUpdateBill(req, res) {
    //var bill = req.body;
    //var db = mongoUtils.connect(config.db);
    //db.then(_.partial(saveBillObject, bill))
      //.then(function () {sendResponse(res, null, 'Success saving ' + bill._id)},
            //_.partial(sendResponse, res, 'Failled to save '+ bill));
//}


exports.getBillREST = getBillREST;
exports.saveOrUpdateBillingItemsREST = saveOrUpdateBillingItemsREST;


exports.getBillObject = getBillObject;
