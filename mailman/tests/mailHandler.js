var assert = require('assert');
var mh = require('../handlers/mailHandler.js');


describe('mailHandler.parseMail', function() {
    it('gets claim id with pattern \w+claim id: {id}', function(done){
        var r = mh._getClaimId({'subject':'FW: abc |claim id: 123'});
        assert.strictEqual(r, '123', 'claim id found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id: {id}', function(done){
        var r = mh._getClaimId({'subject':'claim id: 123'});
        assert.strictEqual(r, '123', 'claim id found in subject');
        done();
    });

    it('gets claim id with pattern ^claim id:{id}', function(done){
        var r = mh._getClaimId({'subject':'claim id:123'});
        assert.strictEqual(r, '123', 'claim id found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid:{id}', function(done){
        var r = mh._getClaimId({'subject':'claimid:123'});
        assert.strictEqual(r, '123', 'claim id found in subject');
        done();
    });

    it('gets claim id with pattern ^claimid: {id}', function(done){
        var r = mh._getClaimId({'subject':'claimid: 123'});
        assert.strictEqual(r, '123', 'claim id found in subject');
        done();
    });
});


