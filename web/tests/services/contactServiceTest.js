var assert = require('assert');
var contactService = require('./../../server/services/contactService.js');
var Contact = require('./../../server/model/Contact.js');

describe('Contact Service', function() {
  var testContact = new Contact();
  testContact.name = 'Test Contact' + new Date().getTime();
  testContact.job = 'Test Job';
  testContact.company = 'Test Company';
  testContact.email = 'Test Email';
  testContact.phone = 'Test Phone';
  testContact.cell = 'Test Cell';

  it('Add Contact', function(done) {
    var req = {body : testContact};
    var res = {};

    res.json = function(data) {
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