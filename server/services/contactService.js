var assert = require('assert');
var Contact = require('./../model/contact.js');
var mongoUtils = require('./../mongoUtils.js');
var serviceUtils = require('./../serviceUtils.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');


/********************************************************/
/* Contacts - Save/update API                           */
/********************************************************/

function saveOrUpdateContact(req, res) {
    assert.ok(req.hasOwnProperty('body'), 'Expecting instance of Request');

    var contactJSON = req.body;
    console.log('Save/update contact: ' + JSON.stringify(contactJSON));
    var contactObj = _.extend(new Contact(), contactJSON);

    // Validate
    if (!_.isString(contactObj.name)) {
        sendResponse(res, 'Please specify a name');
    } else {
        saveOrUpdateContactObject(contactObj)
            .always(function(result){
                result.status === 'Success' ? sendResponse(res, null, result.data) : sendResponse(res, result.details);
            });
    }
}

function saveOrUpdateContactObject(contactObj) {
    assert.ok(contactObj instanceof Contact, 'Expecting instance of Contact object');
    var defer = jQuery.Deferred();

    mongoUtils.saveOrUpdateEntity(contactObj, mongoUtils.CONTACTS_COL_NAME)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}

/********************************************************/
/* Contacts - Read API                                  */
/********************************************************/

function getContact(req, res) {
    assert.ok(req.params.id, 'Expecting ContactId as a parameter');
    var contactId = req.params.id;

    getContactObject(contactId)
        .always(function(result){
            result.status === 'Success' ? sendResponse(res, null, result.data) : sendResponse(res, result.details);
        });
}

function getContactObject(contactId) {
    var defer = jQuery.Deferred();

    mongoUtils.getEntityById(contactId, mongoUtils.CONTACTS_COL_NAME)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
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

/********************************************************/
/* Contacts - Delete API                                  */
/********************************************************/

function deleteContact(contactId) {
    var defer = jQuery.Deferred();

    jQuery.when(mongoUtils.deleteEntity({_id: contactId}, mongoUtils.CONTACTS_COL_NAME))
        .then(defer.resolve())
        .fail(defer.reject());
    return defer;
}

function sendResponse(res, err, jsonData) {
    if (err) {
        console.error('Error: ' + err);
        res.json(500, {'Status': 'Fail', 'Details': err});
    } else {
        console.info('Success response: ' + JSON.stringify(jsonData).substr(0, 100));
        res.json({'status': 'Success', 'data': jsonData});
    }
}

exports.saveOrUpdateContactObject = saveOrUpdateContactObject;
exports.saveOrUpdateContact = saveOrUpdateContact;
exports.getContactObject = getContactObject;
exports.getContact = getContact;
exports.listAllContacts = listAllContacts;
exports.deleteContact = deleteContact;