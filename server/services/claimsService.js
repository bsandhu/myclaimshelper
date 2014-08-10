var Claim = require('./../model/claim.js');
var ClaimEntry = require('./../model/claimEntry.js');
var mongoUtils = require('./../mongoUtils.js');
var Q = require('q');
var assert = require('assert');
var _ = require('underscore');


function saveOrUpdateClaim(req, res) {
    saveOrUpdateEntity(req, res, 'Claims');
}

function saveOrUpdateClaimEntry(req, res) {
    saveOrUpdateEntity(req, res, 'ClaimEntries');
}

function claimsCollection(db) {
    return db.collection('Claims');
}

function claimEntriesCollection(db) {
    return db.collection('ClaimEntries');
}

function saveOrUpdateEntity(req, res, colName) {
    function getseqNum() {
        return mongoUtils.incrementAndGet(colName);
    }

    function dbCall(seqNum){
        mongoUtils.run(function update(db) {
            var entity = req.body;
            var entityCol = db.collection(colName);

            if (!entity._id) {
                entity._id = String(seqNum);
                entityCol.insert(entity,
                    {w: 1},
                    function onInsert(err, results) {
                        console.log('Adding to collection ' + colName);
                        sendResponse(res, err, results[0]);
                    });
            } else {
                entityCol.update({'_id': entity._id},
                    entity,
                    {w: 1},
                    function onUpdate(err, result) {
                        console.log('Updated collection ' + colName);
                        sendResponse(res, err, entity);
                    });
            }
        });
    }

    Q.fcall(getseqNum).then(dbCall).done();
}

function getClaim(req, res) {
    getEntityById(req, res, 'Claims');
}

function getClaimEntry(req, res) {
    getEntityById(req, res, 'ClaimEntries');
}

function getEntityById(req, res, colName) {
    assert.ok(req.params.id, 'Expecting EntityId as a parameter');
    var entityId = req.params.id;
    console.log('Getting Entity: ' + entityId);

    mongoUtils.run(function (db) {
        var entityCol = db.collection(colName);

        entityCol.findOne({'_id': {'$eq': entityId}}, onResults);

        function onResults(err, item) {
            if (err){
                sendResponse(res, err);
            } else if (_.isEmpty(item)){
                sendResponse(res, 'No records with id ' + entityId);
            } else {
                sendResponse(res, err, item);
            }
        }
    });
}

function getAllEntriesForClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    var claimId = req.params.id;
    console.log('Get all entries for Claim: ' + claimId);

    mongoUtils.run(function (db) {
        claimEntriesCollection(db).find({'claimId': claimId}).toArray(onResults);

        function onResults(err, items) {
            var modelObjs = _.map(items, convertToModel);
            sendResponse(res, err, modelObjs);
        }

        function convertToModel(item) {
            return _.extend(new ClaimEntry(), item);
        }
    });
}

function getAllClaims(req, res) {
    console.log('Get all Claims');

    mongoUtils.run(function (db) {
        claimsCollection(db).find().toArray(onResults);

        function onResults(err, items) {
            var modelObjs = _.map(items, convertToModel);
            sendResponse(res, err, modelObjs);
        }

        function convertToModel(item) {
            return _.extend(new Claim(), item);
        }
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


exports.saveOrUpdateClaim = saveOrUpdateClaim;
exports.saveOrUpdateClaimEntry = saveOrUpdateClaimEntry;
exports.getClaim = getClaim;
exports.getClaimEntry = getClaimEntry;
exports.getAllClaims = getAllClaims;
exports.getAllEntriesForClaim = getAllEntriesForClaim;
