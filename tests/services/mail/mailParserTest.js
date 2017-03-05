let assert = require('assert');
let fs = require('fs');
let ms = require('../../../server/services/mail/mailParser.js');
let _ = require('underscore');
let lodash = require('lodash');
let jQuery = require('jquery-deferred');
let Claim = require("../../../server/model/claim.js");
let claimsService = require("../../../server/services/claimsService.js");
let mongoUtils = require('../../../server/mongoUtils.js');


describe('mailParser', function () {

    let file = __dirname + '/data/sent-mail.json';

    let testClaim = new Claim();
    testClaim.description = 'Test claim';
    testClaim.entryDate = new Date(2014, 1, 1);
    testClaim.dueDate = new Date(2014, 1, 10);
    testClaim.summary = "I am test entry";
    testClaim.state = 'open';
    testClaim.insuredContact = {name: 'TestFist', city: 'TestCity', zip: 11010};
    testClaim.insuranceCompanyFileNum = "123";
    testClaim.owner = "DefaultUser";

    before(function (done) {
        let req = {body: testClaim, headers: {userid: 'DefaultUser', group: 'DefaultGroup', ingroups: ['DefaultGroup']}};
        let res = {};
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
        let req = JSON.parse(fs.readFileSync(file, 'utf8'));
        let mailParser = new ms.MailParser();

        jQuery.when(mailParser._getAllKnownClaims('DefaultUser'), mailParser._getAllKnownUserIds())
            .then(function (allKnownClaims, allUserIds) {
                assert.ok(allKnownClaims.length > 0);
                assert.ok(allUserIds.length > 0);

                let entry = mailParser.parseRequest(req, allKnownClaims, allUserIds);
                assert.equal(entry.errors.length, 0);
                assert.deepEqual(entry.claimId, testClaim._id);
                assert.deepEqual(entry.owner, 'DefaultUser');
                assert.deepEqual(Object.keys(entry), ['claimId', 'fileNum', 'owner', 'group', 'attachments', 'tags', 'mail', 'errors']);
                done();
            })
    });

    it('ParseRequest - user name not found', function () {
        let req = JSON.parse(fs.readFileSync(file, 'utf8'));
        let mailParser = new ms.MailParser();
        req.params.subject = 'FW: no claim info';

        // Do not load cache, hence no user match
        let entry = mailParser.parseRequest(req);
        assert.equal(entry.errors.length, 1);
        assert.deepEqual(entry.errors,
            [ 'User <i>DefaultUser</i> is not registered with the MyClaimsHelper.com']);
    });

    it('ParseRequest - Claim not found', function () {
        let req = JSON.parse(fs.readFileSync(file, 'utf8'));
        let mailParser = new ms.MailParser();
        req.params.subject = 'FW: no claim info';

        // Do not load cache, hence no user match
        let entry = mailParser.parseRequest(req, [], ['DefaultUser']);
        assert.equal(entry.errors.length, 1);

        assert.ok(lodash.isString(entry.errors[0]));
        assert.ok(lodash.startsWith(entry.errors[0], 'Could not find a Claim to add this task to'));
    });


    // **** Tags ****

    it('_getTags - gets two tags', function (done) {
        let mailParser = new ms.MailParser();
        let text = '#tag1 #tag2\r\nsome other text'
        let r = mailParser._getTags(text);
        assert.deepEqual(r, ['#tag1', '#tag2']);
        done();
    });


    // **** Claim Ids ****

    it('_getAllKnownClaims', function (done) {
        let mailParser = new ms.MailParser();
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
        let mailParser = new ms.MailParser();
        let info = mailParser._getClaimId(
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
        let mailParser = new ms.MailParser();
        let info = mailParser._getClaimId(
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
        let mailParser = new ms.MailParser();
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
        let mailParser = new ms.MailParser();
        // Note, ignores case on incoming mail
        let userId = mailParser._getUserId('defaultUser@myclaimshelper.com', ['DefaultUser']);
        assert.equal(userId, 'DefaultUser');
    });

    it('_get non existent user id', function (done) {
        let mailParser = new ms.MailParser();
        let userId = mailParser._getUserId('foo@myclaimshelper.com')
        assert.equal(userId, null);
        done();
    });

});

