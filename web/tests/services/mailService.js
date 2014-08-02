var assert = require('assert');
var fs = require('fs');
var ms = require('../../server/services/mailService.js');

describe('parseMailRequest', function(){
    it('gets key mail attributes', function(done){
        var file = __dirname + '/data/sent-mail.json';
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        var r = ms.parseMailRequest(req);
        assert.deepEqual(r.claimId, '123');
        assert.deepEqual(Object.keys(r), ['claimId', 'attachments', 'tags', 'mail']);
        done();
    });
});

describe('_getTags', function(){
    it('gets two tags', function(done){
        var text = '#tag1 #tag2\r\nsome other text'
        var r = ms._getTags(text);
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });
});

describe('_getClaimId', function() {
    it('gets claim id with pattern \w+claim id: {id}', function(done){
        var r = ms._getClaimId('FW: abc |claim id: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id: {id}', function(done){
        var r = ms._getClaimId('claim id: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id:{id}', function(done){
        var r = ms._getClaimId('claim id:123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid:{id}', function(done){
        var r = ms._getClaimId('claimid:123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid: {id}', function(done){
        var r = ms._getClaimId('claimid: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimId: {id}', function(done){
        var r = ms._getClaimId('claimId: 123');
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });
});


