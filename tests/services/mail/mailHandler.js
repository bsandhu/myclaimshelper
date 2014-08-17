var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailHandler.js');


var mailHandler = new ms.MailRequestHandler();

describe('parseRequest', function(){

    it('succeeds', function(done){
        var req = {'params': {'subject': 'claimId:123',
                              'body-plain': 'nothing'}
        };
        var res = {'send':function(){}};
        var r = mailHandler.processRequest(req, res);
        assert.equal(r, true);
        done();
    });

});
