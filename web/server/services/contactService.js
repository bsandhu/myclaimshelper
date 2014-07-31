var contact = require('./../model/contact.js');
var mongoUtils = require('./../mongoUtils.js');

function addContact(req, res) {
    var contact = req.body;

    mongoUtils.run(function (db) {
        var contactsCol = db.collection('Contacts');
        if (!contact._id) {
            contact._id = req.body.name;
            contactsCol.insert(contact, {w: 1}, function (err, result) {
                console.log('Saving contact');
                sendResponse(res, err, result);
            });
        }
        else {
            contactsCol.update({'_id': contact._id}, contact, {w: 1}, function (err, result) {
                console.log('Updating contact');
                sendResponse(res, err, result);
            });
        }
    });
}

function listAllContacts(req, res) {
    console.log('getting all contacts');
    mongoUtils.run(function (db) {
        var contactsCol = db.collection('Contacts');
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

exports.addContact = addContact;
exports.listAllContacts = listAllContacts;