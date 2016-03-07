var profileService = require("./../../server/services/profileService.js");
var mongoUtils = require("./../../server/mongoUtils.js");
var UserProfile = require("../../server/model/profiles.js");

var assert = require("assert");
var jQuery = require('jquery-deferred');

describe('profileService', function () {

    var up = new UserProfile();
    up._id = 'TestProfile1';
    up.billingProfile.timeUnit = 'hour';
    up.billingProfile.distanceUnit = 'mile';
    up.billingProfile.timeRate = 1.2;
    up.billingProfile.distanceRate = 0.3;

    var tempTestId = 'TestUser' + new Date().getTime();

    after(function (done) {
        mongoUtils.deleteEntity({_id: tempTestId}, mongoUtils.USERPROFILE_COL_NAME);
        mongoUtils.deleteEntity({_id: 'TestProfile1'}, mongoUtils.USERPROFILE_COL_NAME)
            .then(done)
            .fail('Failed to cleanup test data');
    });

    it('saveOrUpdateUserProfileREST ok', function (done) {
        var req = {body: up, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            console.log('data.data: ' + data.data);
            done();
        };
        profileService.saveOrUpdateUserProfileREST(req, res);
    });

    it('getUserProfileREST ok', function (done) {
        var req = {params: {id: up._id}, headers: {userid: 'TestUser'}};
        var res = {};
        res.json = function (data) {
            console.log('getUserProfileREST: ' + JSON.stringify(data));
            var up = data.data;
            console.log(data);

            //UserProfile
            assert.equal(up._id, 'TestProfile1');

            //BillingProfile
            assert.equal(up.billingProfile.timeUnit, 'hour');
            assert.equal(up.billingProfile.distanceUnit, 'mile');
            assert.equal(up.billingProfile.timeRate, 1.2);
            assert.equal(up.billingProfile.distanceRate, 0.3);
            done();
        };
        profileService.getUserProfileREST(req, res);
    });

    it('checkAndGetUserProfileREST new profile created', function (done) {
        var req = {headers: {userid: tempTestId}};
        var res = {};
        res.json = function (data) {
            assert.ok(data);
            assert.equal(data.data.owner, tempTestId);
            assert.equal(data.data._id, tempTestId);
            done();
        }
        profileService.checkAndGetUserProfileREST(req, res);
    });

    it('checkAndGetUserProfileREST profile exists', function (done) {
        var req = {headers: {userid: tempTestId}};
        var res = {};
        res.json = function (data) {
            assert.ok(data);
            assert.equal(data.data.owner, tempTestId);
            assert.equal(data.data._id, tempTestId);
            done();
        }
        profileService.checkAndGetUserProfileREST(req, res);
    });

});