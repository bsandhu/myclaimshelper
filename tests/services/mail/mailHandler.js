var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailHandler.js');
var mongoUtils = require('../../../server/mongoUtils.js');


describe('processRequest', function(){
    var assertSuccess = function(data){
      assert.ok(data);
      assert.equal(data.claimId, '123');
      assert.deepEqual(data.tags, [ '#tag1', '#tag2', 'email' ]);
      assert.ok(data.attachments);
      assert.equal(data.mail.subject, 'the subject claim id:123');
      assert.equal(data.mail['body-plain'], 'the body\r\n#tag1\r\n#tag2');
      assert.equal(data.mail.from, 'plato@nonsense.foo');
      var ce = mongoUtils.getEntityById(data._id, 'ClaimEntries');
      assert.ok(ce);
    };

    var assertFailure = function(data){
      console.log(data);
      assert.ok(data.error);
    }; 

    var file = __dirname + '/data/sent-mail.json';
    var req = JSON.parse(fs.readFileSync(file, 'utf8'));
    var res = {'send':function(){}};
    fs.writeFileSync('/tmp/67e8f84cf7851523cb5f8635cf7208ed', 'whatever');

    it('succeeds', function(done){
      ms.process(req, res).done(assertSuccess).always(function(){done()});
    });

    it('fails to save attachments', function(done){
      req.files['attachment-1'].path = 'nonsense'
      ms.process(req, res).fail(assertFailure).always(function(){done()});

    });
});


