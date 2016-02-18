var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailParser.js');
var _ = require('underscore');


var mailParser = new ms.MailParser();

describe('parseRequest', function () {
    var file = __dirname + '/data/sent-mail.json';

    it('gets key mail attributes', function (done) {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        mailParser
            ._getAllKnownClaimIds()
            .then(function(){
                var r = mailParser.parseRequest(req);
                assert.deepEqual(r.claimId, '123');
                assert.deepEqual(Object.keys(r), ['claimId', 'attachments', 'tags', 'mail', 'error']);
                done();
            })
    });

    it('stores errors when no ClaimId', function () {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        req.params.subject = 'FW: no claim info';
        mailParser.parseRequest(req);
        assert.equal(mailParser.errors.length, 1);
        assert.deepEqual(mailParser.errors, [new Error('ClaimId not found!')]);
    });
});

describe('_getTags', function () {
    it('gets two tags', function (done) {
        var text = '#tag1 #tag2\r\nsome other text'
        var r = mailParser._getTags(text);
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });
});

describe('_getClaimId', function () {

    it('_getAllKnownClaimIds', function (done) {
        mailParser
            ._getAllKnownClaimIds()
            .done(function (resp) {
                assert.ok(resp);
                assert.ok(_.isArray(resp));
                assert.ok(resp.length > 0);
                done();
            })
    });

    it('_get claim id', function (done) {
        mailParser
            ._getAllKnownClaimIds()
            .then(function (ids) {
                var claimId = mailParser._getClaimId('FW: abc |claim id: ' + ids[0]);
                assert.equal(claimId, ids[0]);
                done();
            });
    });

    it('_get non existent claim id', function (done) {
        var claimId = mailParser._getClaimId('FW: abc |claim id: XXX')
        assert.equal(claimId, null);
        done();
    });
});

