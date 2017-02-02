let assert = require('assert');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let _ = require('underscore');


function getRefData(req, res) {
    assert.ok(req.params.type, 'Expecting type as a parameter');
    let search = {'type': req.params.type};
    serviceUtils.getData(req, res, mongoUtils.REFDATA_COL_NAME, search);
}

function addRefData(req, res) {
    serviceUtils.addData(req, res, mongoUtils.REFDATA_COL_NAME);
}

exports.getRefData = getRefData;
exports.addRefData = addRefData;