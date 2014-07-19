var assert = require('assert');
var mh = require('../handlers/mailHandler.js');

describe('_getTags', function(){
    it('get two tags', function(done){
        var text = '#tag1 #tag2\r\nsome other text'
        var r = mh._getTags({'text': text});
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });
});

describe('_getClaimId', function() {
    it('gets claim id with pattern \w+claim id: {id}', function(done){
        var r = mh._getClaimId({'subject':'FW: abc |claim id: 123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id: {id}', function(done){
        var r = mh._getClaimId({'subject':'claim id: 123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id:{id}', function(done){
        var r = mh._getClaimId({'subject':'claim id:123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid:{id}', function(done){
        var r = mh._getClaimId({'subject':'claimid:123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid: {id}', function(done){
        var r = mh._getClaimId({'subject':'claimid: 123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });

    it('gets claim id with pattern ^claimId: {id}', function(done){
        var r = mh._getClaimId({'subject':'claimId: 123'});
        assert.strictEqual(r, '123', 'claim id not found in subject');
        done();
    });
});


