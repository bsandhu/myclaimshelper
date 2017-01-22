let assert = require('assert');
let fs = require('fs');
let _ = require('lodash');
let ms = require('../../../server/services/mail/mailHandler.js');
let mongoUtils = require('../../../server/mongoUtils.js');
let Claim = require("../../../server/model/claim.js");
let claimsService = require("../../../server/services/claimsService.js");
let jQuery = require('jquery-deferred');


describe('mailHandler', function(){

    let file = __dirname + '/data/sent-mail.json';
    let req = JSON.parse(fs.readFileSync(file, 'utf8'));
    let res = {'send':function(){}};
    fs.writeFileSync('/tmp/67e8f84cf7851523cb5f8635cf7208ed', 'whatever');

    before(function(done){
        let testClaim = new Claim();
        testClaim.insuranceCompanyFileNum = "123";
        testClaim.fileNum = "04-12345";
        let req = {body: testClaim, headers: {userid: 'testuser1', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.saveOrUpdateClaim(req, res);
    });

    after(function(done) {
        jQuery.when(mongoUtils.deleteEntity({insuranceCompanyFileNum: "123"}, mongoUtils.CLAIMS_COL_NAME))
            .done(done)
            .fail('Failed to cleanup test data');
    });

    it('processRequest succeeds for Insurance co', function (done) {
        let assertSuccess = function (data) {
            assert.ok(data);
            assert.ok(data.claimId);
            assert.ok(data.owner);
            assert.deepEqual(data.tags, [ '#tag1', '#tag2', 'email' ]);
            assert.ok(data.attachments);
            assert.equal(data.mail.subject, 'the subject claim id: 123');
            assert.equal(data.mail['body-plain'], 'the body\r\n#tag1\r\n#tag2');
            assert.equal(data.mail.From, 'plato@nonsense.foo');

            let ce = mongoUtils.getEntityById(data._id, 'ClaimEntries', 'TestUser');
            ce.then(function (entry) {
                console.log(arguments);
                assert.ok(arguments)
            });
            done();
        };

        req.params.To = 'TESTUSER1@foo.com';
        ms.process(req, res, true).then(assertSuccess);
    });

    it('processRequest succeeds for file num', function (done) {
        let assertSuccess = function (data) {
            assert.ok(data);
            assert.ok(data.claimId);
            assert.ok(data.owner);
            assert.deepEqual(data.tags, [ '#tag1', '#tag2', 'email' ]);
            assert.ok(data.attachments);
            assert.equal(data.mail.subject, 'the subject of email is 04-12345');
            assert.equal(data.mail.From, 'plato@nonsense.foo');

            let ce = mongoUtils.getEntityById(data._id, 'ClaimEntries', 'TestUser');
            ce.then(function (entry) {
                console.log(arguments);
                assert.ok(arguments)
            });
            done();
        };

        req.params.To = 'TESTUSER1@foo.com';
        req.params.subject = 'the subject of email is 04-12345';
        ms.process(req, res, true).then(assertSuccess);
    });
    
    it('fails to save attachments', function(done){
      let assertFailure = function(data){
        console.log(data);
        assert.ok(data.error);
        done();
      }; 
      req.files['attachment-1'].path = 'nonsense'
      ms.process(req, res, true).fail(assertFailure);

    });
    
    it('fails to find matching claim', function(done){
      let assertFailure = function(data){
        console.log(data);
        assert.ok(_.isString(data.errors[0]));
        assert.ok(_.startsWith(data.errors[0], 'Could not find a Claim to add this task to'));
        done();
      }; 

      req.params.subject = "the subject claim id:AAA"
      ms.process(req, res, true).fail(assertFailure);
    });

});


