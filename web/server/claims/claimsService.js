var models = require('./../models/models.js');
var mongoUtils = require('./../MongoUtils.js');
var ObjectId = require('mongodb').ObjectID;
var _ = require('underscore');

function saveClaim(req, res) {
    saveEntity(req, res, 'Claims')
}

function saveClaimEntry(req, res) {
    saveEntity(req, res, 'ClaimEntries')
}

function saveEntity(req, res, colName) {
    var entity = req.body;
    mongoUtils.run(function (db) {
        var entityCol = db.collection(colName);
        entityCol.insert(entity, {w: 1}, function (err, result) {
            console.log('Saving entity ' + colName);
            sendResponse(res, err, result);
        });
    });
};

function getAllClaims(req, res) {
    console.log('Get all claims list');
    mongoUtils.run(function (db) {
        var claims = db.collection('Claims');
        claims.find().toArray(function (err, items) {
            sendResponse(res, err, items);
        });
    });
}

function getClaim(req, res) {
    var claimId = req.params.id;
    console.log('Getting claim: ' + claimId);

    mongoUtils.run(function (db) {
        var claims = db.collection('Claims');
        claims.find({'_id': {'$eq': ObjectId(claimId)}}).toArray(function (err, items) {
            var resData = (items.length == 0)
                ? 'No claim found with id ' + claimId
                : _.extend(new models.Claim(), items[0]);
            sendResponse(res, err, resData);
        });
    });
}

function getEntries(req, res) {
    console.log('Getting claim entries: ' + req.params.id);

    mongoUtils.run(function (db) {
        var claimEntries = db.collection('ClaimEntries');
        var entries = [];
        var errors = undefined;

        claimEntries.find({'claimId': {'$eq': req.params.id}}).toArray(function (err, items) {
            errors = err;
            for(var i=0; i<items.length; i++) {
                var newEntry = new models.ClaimEntry();
                _.extend(newEntry, items[i]);
                entries.push(newEntry)
            }
            sendResponse(res, errors, entries);
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


exports.getClaim = getClaim;
exports.getAllClaims = getAllClaims;
exports.saveClaim = saveClaim;
exports.saveClaimEntry = saveClaimEntry;
exports.getEntries = getEntries;
