var claim = require('./../model/claim.js');
var mongoUtils = require('./../mongoUtils.js');
var ObjectId = require('mongodb').ObjectID;
var _ = require('underscore');

function saveClaim(req, res) {
    var claim = req.body;
    mongoUtils.run(function (db) {

        var entityCol = db.collection('Claims');
        if (!claim._id) {
            entityCol.insert(claim, {w: 1}, function (err, result) {
                console.log('Saving Claim');
                sendResponse(res, err, result);
            });
        } else {
            entityCol.update({_id: claim._id}, claim, {w: 1}, function (err, result) {
                console.log('Updating Claim');
                sendResponse(res, err, result);
            });
        }
    });
};

function getClaim(req, res) {
    var claimId = req.params.id;
    console.log('Getting claim: ' + claimId);

    mongoUtils.run(function (db) {
        var claims = db.collection('Claims');
        claims.find({'_id': {'$eq': ObjectId(claimId)}}).toArray(function (err, items) {
            var resData = (items.length == 0)
                ? 'No claim found with id ' + claimId
                : _.extend(new claim.Claim(), items[0]);
            sendResponse(res, err, resData);
        });
    });
}

function getAllClaims(req, res) {
    console.log('Get all app list');
    mongoUtils.run(function (db) {
        var claims = db.collection('Claims');
        claims.find().toArray(function (err, items) {
            sendResponse(res, err, items);
        });
    });
}

function sendResponse(res, err, jsonData) {
    if (err) {
        console.error('Error: ' + err);
        res.json(500, {'Status': 'Fail', 'Details': err});
    } else {
        console.info('Success response: ' + JSON.stringify(jsonData));
        res.json({'status': 'Success', 'data': jsonData});
    }
}


exports.saveClaim = saveClaim;
exports.getClaim = getClaim;
exports.getAllClaims = getAllClaims;
