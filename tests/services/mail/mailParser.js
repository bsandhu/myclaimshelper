var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailParser.js');

var mailParser = new ms.MailParser();

describe('parseRequest', function(){
    var file = __dirname + '/data/sent-mail.json';

    it('gets key mail attributes', function(done){
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        var r = mailParser.parseRequest(req);
        assert.deepEqual(r.claimId, '123');
        assert.deepEqual(Object.keys(r), ['claimId', 'attachments', 'tags', 'mail']);
        done();
    });

    it('stores errors when no ClaimId', function() {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        req.params.subject = 'FW: no claim info';
        mailParser.parseRequest(req);
        assert.equal(mailParser.errors.length, 1);
        assert.deepEqual(mailParser.errors, [new Error('ClaimId not found!')]);
    });
});

describe('_getTags', function(){
    it('gets two tags', function(done){
        var text = '#tag1 #tag2\r\nsome other text'
        var r = mailParser._getTags(text);
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });
});

describe('_getClaimId', function() {
    it('gets claim id with pattern \w+claim id: {id}', function(done){
        var r = mailParser._getClaimId('FW: abc |claim id: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id: {id}', function(done){
        var r = mailParser._getClaimId('claim id: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id:{id}', function(done){
        var r = mailParser._getClaimId('claim id:123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid:{id}', function(done){
        var r = mailParser._getClaimId('claimid:123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid: {id}', function(done){
        var r = mailParser._getClaimId('claimid: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimId: {id}', function(done){
        var r = mailParser._getClaimId('claimId: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });
});


