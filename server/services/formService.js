let assert = require('assert');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let _ = require('underscore');
let addOwnerInfo = mongoUtils.addOwnerInfo;
let sendResponse = serviceUtils.sendResponse;


function getFormData(req, res) {
    assert.ok(req.params.id, 'Expecting id as a parameter');
    let search = {'_id': req.params.id};
    serviceUtils.getData(req, res, mongoUtils.FORMDATA_COL_NAME, search);
}

function addFormData(req, res) {
    serviceUtils.addData(req, res, mongoUtils.FORMDATA_COL_NAME);
}

function getAllFormsForClaim(req, res) {
    assert.ok(req.params.id, 'Expecting ClaimId as a parameter');
    let claimId = req.params.id;
    let query = addOwnerInfo(req, {'claimId': claimId});

    console.log('Searching for Forms. Req: ' + JSON.stringify(query));
    mongoUtils.run(function (db) {
        mongoUtils.findEntities(mongoUtils.FORMDATA_COL_NAME, query, db)
            .then(data => sendResponse(res, null, data))
            .fail(err => sendResponse(res, err, null));
    });
}

exports.getFormData = getFormData;
exports.addFormData = addFormData;
exports.getAllFormsForClaim = getAllFormsForClaim;