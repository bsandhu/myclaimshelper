let assert = require('assert');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let Form = require('./../model/form');
let _ = require('underscore');
let addOwnerInfo = mongoUtils.addOwnerInfo;
let sendResponse = serviceUtils.sendResponse;


function getFormData(req, res) {
    assert.ok(req.params.id, 'Expecting id as a parameter');

    let search = {'_id': req.params.id};
    search = mongoUtils.addOwnerInfo(req, search);

    mongoUtils.run(function (db) {
        mongoUtils.findEntities(mongoUtils.FORMDATA_COL_NAME, search, db)
            .then(data => {
                let savedForm = data[0];
                let savedData = savedForm.data;
                let allDataAttr = new Form().data;
                savedForm.data = _.extend(allDataAttr, savedData);
                sendResponse(res, null, savedForm)
            })
            .fail(err => sendResponse(res, err, null));
    });
}

function addFormData(req, res) {
    let form = req.body;
    form = mongoUtils.addOwnerInfo(req, form);

    let formDataStripped = _.omit(form.data, (value, key, object) => {
        return value == "";
    });
    form.data = formDataStripped;

    mongoUtils.run(function (db) {
        mongoUtils.saveOrUpdateEntity(form, mongoUtils.FORMDATA_COL_NAME)
            .always(function (errs, results) {
                let form = results;
                form.data = _.extend(new Form().data, form.data);
                sendResponse(res, errs, results);
            })
    });
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