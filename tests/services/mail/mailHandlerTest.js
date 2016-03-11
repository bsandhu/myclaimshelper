var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailHandler.js');
var mongoUtils = require('../../../server/mongoUtils.js');
var Claim = require("../../../server/model/claim.js");
var claimsService = require("../../../server/services/claimsService.js");

var setupClaim = function(){
    var testClaim = new Claim();
    testClaim.insuranceCompanyFileNum = "123";
    var req = {body: testClaim, headers: {userid: 'DefaultUser'}};
    var res = {};
    res.json = function (data) {
        assert(data);
        assert.equal(data.status, 'Success');
    };
    claimsService.saveOrUpdateClaim(req, res);
};

describe('mailHandler', function(){

    var file = __dirname + '/data/sent-mail.json';
    var req = JSON.parse(fs.readFileSync(file, 'utf8'));
    var res = {'send':function(){}};
    fs.writeFileSync('/tmp/67e8f84cf7851523cb5f8635cf7208ed', 'whatever');


    it('processRequest succeeds', function (done) {
        var assertSuccess = function (data) {
            assert.ok(data);
            assert.ok(data.claimId);
            assert.ok(data.owner);
            assert.deepEqual(data.tags, [ '#tag1', '#tag2', 'email' ]);
            assert.ok(data.attachments);
            assert.equal(data.mail.subject, 'the subject claim id: 123');
            assert.equal(data.mail['body-plain'], 'the body\r\n#tag1\r\n#tag2');
            assert.equal(data.mail.From, 'plato@nonsense.foo');

            var ce = mongoUtils.getEntityById(data._id, 'ClaimEntries', 'TestUser');
            ce.then(function (entry) {
                console.log(arguments);
                assert.ok(arguments)
            });
            done();
        };

        setupClaim();
        ms.process(req, res, false).then(assertSuccess);
    });
    
    it('fails to save attachments', function(done){
      var assertFailure = function(data){
        console.log(data);
        assert.ok(data.error);
        done();
      }; 
      req.files['attachment-1'].path = 'nonsense'
      ms.process(req, res, false).fail(assertFailure);

    });
    
    it('fails to find matching claim', function(done){
      var assertFailure = function(data){
        console.log(data);
        assert.equal(data.errors[0], 'Could not find a matching claim. Plase ensure that the subject line of the email has the Claim file number');
        done();
      }; 

      req.params.subject = "the subject claim id:AAA"
      ms.process(req, res, false).fail(assertFailure);
    });

});


