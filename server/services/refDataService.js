let assert = require('assert');
let sendResponse = require('./claimsService.js').sendResponse;
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let _ = require('underscore');


function getRefData(req, res) {
    assert.ok(req.params.type, 'Expecting type as a parameter');

    let search = {'type': req.params.type};
    search = mongoUtils.addOwnerInfo(req, search);

    mongoUtils.run(function (db) {
        mongoUtils.findEntities(mongoUtils.REFDATA_COL_NAME, search, db)
            .then(data => sendResponse(res, null, data))
            .fail(err => sendResponse(res, err, null));
    });
}

function addRefData(req, res) {
    let entity = req.body;
    entity = mongoUtils.addOwnerInfo(req, entity);

    mongoUtils.run(function (db) {
        mongoUtils.saveOrUpdateEntity(entity, mongoUtils.REFDATA_COL_NAME)
            .always((errs, results) => sendResponse(res, errs, results))
    });
}

exports.getRefData = getRefData;
exports.addRefData = addRefData;