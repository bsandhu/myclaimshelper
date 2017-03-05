let assert = require('assert');
let refDataService = require('./../../server/services/refDataService.js');
let profileService = require('./../../server/services/profileService.js');
let RefData = require('./../../server/model/refData.js');
let mongoUtils = require('./../../server/mongoUtils.js');


describe('RefDataService', function () {
    let testData = new RefData();
    testData.type = 'ClaimTypes';
    testData.text = 'TestData';

    after(function (done) {
        assert.ok(testData._id);
        mongoUtils.deleteEntity({_id: testData._id}, mongoUtils.REFDATA_COL_NAME)
            .done(done)
            .fail('Failed to cleanup test RefData');
    });

    it('Add new claim type', function (done) {
        let req = {
            body: testData,
            headers: {userid: 'TestUser', group: profileService.DEFAULT_GROUP, ingroups: [profileService.DEFAULT_GROUP]}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            // RefData instance
            assert.ok(data.data);
            assert.equal(data.data.type, 'ClaimTypes');
            assert.equal(data.data.text, 'TestData');
            assert.equal(data.data.owner, 'TestUser');
            assert.equal(data.data.group, profileService.DEFAULT_GROUP);
            done();
        };

        refDataService.addRefData(req, res);
    });

    it('GetClaimTypes', function (done) {
        let req = {
            params: {type: 'ClaimTypes'},
            headers: {userid: 'TestUser', ingroups: [profileService.DEFAULT_GROUP]}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data[0].type, 'ClaimTypes');
            assert.ok(data.data[0].owner);
            assert.ok(data.data[0].group);
            done();
        };
        refDataService.getRefData(req, res);
    });

    it('GetClaimTypes by group filter', function (done) {
        let req = {params: {type: 'ClaimTypes'}, headers: {userid: 'BadUser', ingroups: ['BadGroup']}};
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.length, 0);
            done();
        };
        refDataService.getRefData(req, res);
    });


});