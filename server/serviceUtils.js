let assert = require('assert');
let jQuery = require('jquery-deferred');
let EventEmitter = require('events').EventEmitter;
let mongoUtils = require('./mongoUtils.js');


function sendResponse(res, err, jsonData) {
    if (err) {
        console.error('Error: ' + err);
        res.json(500, {'Status': 'Fail', 'Details': err});
    } else {
        console.info('Success response: ' + JSON.stringify(jsonData).substr(0, 100));
        res.json({'status': 'Success', 'data': jsonData});
    }
}

function createResponse(err, results) {
    if (err) {
        return {'status': 'Fail', 'details': err};
    } else {
        return {'status': 'Success', 'data': results};
    }
}

function getData(req, res, colName, search) {
    search = mongoUtils.addOwnerInfo(req, search);

    mongoUtils.run(function (db) {
        mongoUtils.findEntities(colName, search, db)
            .then(data => sendResponse(res, null, data))
            .fail(err => sendResponse(res, err, null));
    });
}

function addData(req, res, colName) {
    let entity = req.body;
    entity = mongoUtils.addOwnerInfo(req, entity);

    mongoUtils.run(function (db) {
        mongoUtils.saveOrUpdateEntity(entity, colName)
            .always(function (errs, results) {
                sendResponse(res, errs, results);
            })
    });
}

exports.eventEmitter = new EventEmitter();
exports.createResponse = createResponse;
exports.getData = getData;
exports.addData = addData;
exports.sendResponse = sendResponse;
