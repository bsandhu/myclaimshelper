let assert = require('assert');
let Contact = require('./../model/contact.js');
let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let jQuery = require('jquery-deferred');
let _ = require('underscore');


/********************************************************/
/* Contacts - Save/update API                           */
/********************************************************/

function saveOrUpdateContact(req, res) {
    assert.ok(req.hasOwnProperty('body'), 'Expecting instance of Request');

    let contactJSON = req.body;
    console.log('Save/update contact: ' + JSON.stringify(contactJSON));
    let contactObj = _.extend(new Contact(), contactJSON);
    contactObj.owner = req.headers.userid;
    contactObj.group = req.headers.group;

    // Validate
    if (!_.isString(contactObj.name)) {
        sendResponse(res, 'Please specify a name');
    } else {
        saveOrUpdateContactObject(contactObj)
            .always(function (result) {
                result.status === 'Success' ? sendResponse(res, null, result.data) : sendResponse(res, result.details);
            });
    }
}

function saveOrUpdateContactObject(contactObj) {
    assert.ok(contactObj instanceof Contact, 'Expecting instance of Contact object');
    let defer = jQuery.Deferred();

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
    let contactId = req.params.id;

    getContactObject(contactId, req.headers.userid, req.headers.ingroups)
        .always(function (result) {
            result.status === 'Success' ? sendResponse(res, null, result.data) : sendResponse(res, result.details);
        });
}

function getContactObject(contactId, owner, ingroups) {
    let defer = jQuery.Deferred();

    mongoUtils.getEntityById(contactId, mongoUtils.CONTACTS_COL_NAME, owner, ingroups)
        .always(function (err, results) {
            defer.resolve(serviceUtils.createResponse(err, results));
        });
    return defer;
}

function listAllContacts(req, res) {
    console.log('getting all contacts');
    mongoUtils.run(function (db) {
        mongoUtils.findEntities(
            mongoUtils.CONTACTS_COL_NAME,
            {'owner': req.headers.userid, 'ingroups': req.headers.ingroups},
            db)
            .then(function(contacts){
                sendResponse(res, null, contacts);
            })
            .fail(function(err){
                sendResponse(res, err, null);
            })
    });
}

/********************************************************/
/* Contacts - Delete API                                  */
/********************************************************/

function deleteContact(contactId) {
    let defer = jQuery.Deferred();

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