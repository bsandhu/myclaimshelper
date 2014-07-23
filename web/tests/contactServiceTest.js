var assert = require('assert');
var contactService = require('./../server/services/contactService.js');
var contact = require('./../server/model/contact.js');

describe('Contact Service', function() {
  var testContact = new contact.Contact();
  testContact.name = 'Test Contact';
  testContact.job = 'Test Job';
  testContact.company = 'Test Company';
  testContact.email = 'Test Email';
  testContact.phone = 'Test Phone';
  testContact.cell = 'Test Cell';

  it('Add Contact', function(done) {
    var req = {};
    req.body = testContact;
    var res = {};
    res.json = function(err, data) {      
      assert(data);
      assert.equal(data.status, 'Success');
      assert.ok(testContact._id);
      done();
    };
    contactService.addContact(req, res, 'Contacts');
  });

  it('List All Contacts', function(done) {
    var req = {};
    var res = {};
    res.json = function(data) {
      assert(data);
      assert.equal(data.status, 'Success');
      assert(data.data.length >= 1);
      done();
    };
    contactService.listAllContacts(req, res);
  });

});