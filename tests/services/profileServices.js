var profileService = require("./../../server/services/profileService.js");
var mongoUtils = require("./../../server/mongoUtils.js");
var UserProfile = require("../../server/model/profiles.js");

var assert = require("assert");
var jQuery = require('jquery-deferred');

describe('profileService', function () {

    var up = new UserProfile('up1');
    up._id = 'up1';
    up.userName = 'Emiliano';
    up.billingProfile.timeUnit = 'hour';
    up.billingProfile.distanceUnit = 'mile';
    up.billingProfile.timeRate = 1.2;
    up.billingProfile.distanceRate = 0.3;

    it('saveOrUpdateUserProfileREST ok', function (done) {
        var req = {body: up};
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
        var req = {params: {id: up._id}};
        var res = {};
        res.json = function (data) {
            console.log('getUserProfileREST: ' + JSON.stringify(data));
            var up = data.data;
            console.log(data);
            //UserProfile
            assert.equal(up._id, 'up1');
            assert.equal(up.userName, 'Emiliano');
            //BillingProfile
            assert.equal(up.billingProfile.timeUnit, 'hour');
            assert.equal(up.billingProfile.distanceUnit, 'mile');
            assert.equal(up.billingProfile.timeRate, 1.2);
            assert.equal(up.billingProfile.distanceRate, 0.3);
            done();
        };
        profileService.getUserProfileREST(req, res);
    });
});
