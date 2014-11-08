var assert = require('assert')
var Bill = require('../model/bill.js');
var sendResponse = require('./claimsService.js').sendResponse;
var mongoUtils = require('./../mongoUtils.js');
var _ = require('underscore');

function _billsCollection(db) {
    return db.collection(mongoUtils.BILL_COL_NAME);
}

// TODO: remove duplicate code.

function getAllBills(req, res) {
    console.log('Get all Bills');

    mongoUtils.run(function (db) {
        _billsCollection(db).find().toArray(_onResults);
        
        function _onResults(err, items) {
            var modelObjs = _.map(items, _convertToModel);
            sendResponse(res, err, modelObjs);
        }

        function _convertToModel(item) {
            return _.extend(new Bill(), item);
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
            var modelObjs = _.map(items, _convertToModel);
            sendResponse(res, err, modelObjs);
        }

        function _convertToModel(item) {
            return _.extend(new Bill(), item);
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
