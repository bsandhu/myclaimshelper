var assert = require('assert');
var fs = require('fs');
var ms = require('../../../server/services/mail/mailParser.js');
var _ = require('underscore');
var lodash = require('lodash');
var jQuery = require('jquery-deferred');
var Claim = require("../../../server/model/claim.js");
var claimsService = require("../../../server/services/claimsService.js");
var mongoUtils = require('../../../server/mongoUtils.js');


describe('mailParser', function () {

    var file = __dirname + '/data/sent-mail.json';

    var testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";
    testClaim.state = 'open';
    testClaim.insuredContact = {name: 'TestFist', city: 'TestCity', zip: 11010};
    testClaim.insuranceCompanyFileNum = "123";
    testClaim.owner = "DefaultUser";

    before(function (done) {
        var req = {body: testClaim, headers: {userid: 'DefaultUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            testClaim._id = data.data._id
            assert.equal(data.status, 'Success');
            done();
        };
        claimsService.saveOrUpdateClaim(req, res)
    });

    after(function(done) {
        jQuery.when(mongoUtils.deleteEntity({insuranceCompanyFileNum: "123"}, mongoUtils.CLAIMS_COL_NAME))
            .done(done)
            .fail('Failed to cleanup test data');
    });

    it('ParseRequest - gets key mail attributes', function (done) {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        var mailParser = new ms.MailParser();

        jQuery.when(mailParser._getAllKnownClaims('DefaultUser'), mailParser._getAllKnownUserIds())
            .then(function (allKnownClaims, allUserIds) {
                assert.ok(allKnownClaims.length > 0);
                assert.ok(allUserIds.length > 0);

                var entry = mailParser.parseRequest(req, allKnownClaims, allUserIds);
                assert.equal(entry.errors.length, 0);
                assert.deepEqual(entry.claimId, testClaim._id);
                assert.deepEqual(entry.owner, 'DefaultUser');
                assert.deepEqual(Object.keys(entry), ['claimId', 'fileNum', 'owner', 'attachments', 'tags', 'mail', 'errors']);
                done();
            })
    });

    it('ParseRequest - user name not found', function () {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        var mailParser = new ms.MailParser();
        req.params.subject = 'FW: no claim info';

        // Do not load cache, hence no user match
        var entry = mailParser.parseRequest(req);
        assert.equal(entry.errors.length, 1);
        assert.deepEqual(entry.errors,
            [ 'User <i>DefaultUser</i> is not registered with the MyClaimsHelper.com']);
    });

    it('ParseRequest - Claim not found', function () {
        var req = JSON.parse(fs.readFileSync(file, 'utf8'));
        var mailParser = new ms.MailParser();
        req.params.subject = 'FW: no claim info';

        // Do not load cache, hence no user match
        var entry = mailParser.parseRequest(req, [], ['DefaultUser']);
        assert.equal(entry.errors.length, 1);

        assert.ok(lodash.isString(entry.errors[0]));
        assert.ok(lodash.startsWith(entry.errors[0], 'Could not find a Claim to add this task to'));
    });


    // **** Tags ****

    it('_getTags - gets two tags', function (done) {
        var mailParser = new ms.MailParser();
        var text = '#tag1 #tag2\r\nsome other text'
        var r = mailParser._getTags(text);
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });


    // **** Claim Ids ****

    it('_getAllKnownClaims', function (done) {
        var mailParser = new ms.MailParser();
        mailParser
            ._getAllKnownClaims('DefaultUser')
            .done(function (resp) {
                assert.ok(resp);
                assert.ok(_.isArray(resp));
                assert.ok(resp.length > 0);
                assert.ok(_.has(resp[0], 'insuranceCompanyFileNum'));
                assert.ok(_.has(resp[0], 'owner'));
                done();
            })
    });

    it('_get claim id', function (done) {
        var mailParser = new ms.MailParser();
        var info = mailParser._getClaimId(
            'FW: abc |claim id: X100',
            [
                {insuranceCompanyFileNum: 'X100', owner: 'TestUser', _id: 5000}
            ],
            'TestUser');
        assert.equal(info[0], 5000);
        assert.equal(info[1], 'X100');
        done();
    });

    it('_get non existent claim id', function () {
        var mailParser = new ms.MailParser();
        var info = mailParser._getClaimId(
            'FW: abc |claim id: XXX',
            [
                {insuranceCompanyFileNum: 'X100', owner: 'TestUser'}
            ],
            'TestUser')
        assert.equal(info[0], null);
        assert.equal(info[1], null);
    });


    // **** User Ids ****

    it('_getAllKnownUserIds', function (done) {
        var mailParser = new ms.MailParser();
        mailParser
            ._getAllKnownUserIds()
            .done(function (resp) {
                assert.ok(resp);
                assert.ok(_.isArray(resp));
                assert.ok(resp.length > 0);
                assert.ok(_.contains(resp, "DefaultUser"));
                done();
            })
    });

    it('_get user id', function () {
        var mailParser = new ms.MailParser();
        // Note, ignores case on incoming mail
        var userId = mailParser._getUserId('defaultUser@myclaimshelper.com', ['DefaultUser']);
        assert.equal(userId, 'DefaultUser');
    });

    it('_get non existent user id', function (done) {
        var mailParser = new ms.MailParser();
        var userId = mailParser._getUserId('foo@myclaimshelper.com')
        assert.equal(userId, null);
        done();
    });

});

