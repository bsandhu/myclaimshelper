var assert = require('assert');
var Contact = require('./../model/contact.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var jQuery = require('jquery-deferred');


function saveOrUpdateContactObject(contactObj) {
    assert.ok(contactObj instanceof Contact, 'Expecting instance of Contact object');
    var defer = jQuery.Deferred();

    mongoUtils.saveOrUpdateEntity(contactObj, mongoUtils.CONTACTS_COL_NAME)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}

function getContactObject(contactId) {
    var defer = jQuery.Deferred();

    mongoUtils.getEntityById(contactId, mongoUtils.CONTACTS_COL_NAME)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}

function deleteContact(contactId) {
    var defer = jQuery.Deferred();

    jQuery.when(mongoUtils.deleteEntity({_id: contactId}, mongoUtils.CONTACTS_COL_NAME))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function listAllContacts(req, res) {
    console.log('getting all contacts');
    mongoUtils.run(function (db) {
        var contactsCol = db.collection(mongoUtils.CONTACTS_COL_NAME);
        contactsCol.find().toArray(function (err, items) {
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

exports.saveOrUpdateContactObject = saveOrUpdateContactObject;
exports.getContactObject = getContactObject;
exports.listAllContacts = listAllContacts;
exports.deleteContact = deleteContact;