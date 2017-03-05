let profileService = require("./../../server/services/profileService.js");
let mongoUtils = require("./../../server/mongoUtils.js");
let UserProfile = require("../../server/model/profiles.js");

let assert = require("assert");
let jQuery = require('jquery-deferred');
let _ = require('lodash');

describe('profileService', function () {

    let up = new UserProfile();
    up._id = 'TestProfile1';
    up.billingProfile.timeUnit = 'hour';
    up.billingProfile.distanceUnit = 'mile';
    up.billingProfile.timeRate = 1.2;
    up.billingProfile.distanceRate = 0.3;
    up.owner = "TestOwner";
    up.group = "TestGroup";

    let tempTestId = 'TestUser' + new Date().getTime();

    after(function (done) {
        mongoUtils.deleteEntity({_id: tempTestId}, mongoUtils.USERPROFILE_COL_NAME);
        mongoUtils.deleteEntity({_id: 'TestProfile1'}, mongoUtils.USERPROFILE_COL_NAME)
            .then(done)
            .fail('Failed to cleanup test data');
    });

    it('saveOrUpdateUserProfileREST ok', function (done) {
        let req = {body: up, headers: {userid: 'TestUser', group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            console.log('data.data: ' + data.data);
            done();
        };
        profileService.saveOrUpdateUserProfileREST(req, res);
    });

    it('checkAndGetUserProfileREST new profile created', function (done) {
        let req = {headers: {userid: tempTestId, group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert.ok(data);
            assert.equal(data.data.owner, tempTestId);
            assert.equal(data.data._id, tempTestId);
            assert.equal(data.data.group, tempTestId);

            assert.ok(_.isArray(data.data.ingroups));
            assert.ok(data.data.ingroups.indexOf(tempTestId) >= 0);
            assert.ok(data.data.ingroups.indexOf(profileService.DEFAULT_GROUP) >= 0);
            done();
        }
        profileService.checkAndGetUserProfileREST(req, res);
    });

    it('checkAndGetUserProfileREST profile exists', function (done) {
        let req = {headers: {userid: tempTestId, group: 'TestGroup', ingroups: ['TestGroup']}};
        let res = {};
        res.json = function (data) {
            assert.ok(data);
            assert.equal(data.data.owner, tempTestId);
            assert.equal(data.data._id, tempTestId);
            done();
        }
        profileService.checkAndGetUserProfileREST(req, res);
    });

    it('modify existing', function (done) {
        profileService
            ._modifyUserProfile(tempTestId, {'claimsTourDone': true})
            .then(function () {
                mongoUtils
                    .connect()
                    .then(function (db) {
                        mongoUtils.findEntities(mongoUtils.USERPROFILE_COL_NAME,
                            {"_id": tempTestId, owner: tempTestId, ingroups: [tempTestId]}, db)
                            .then(function (profiles) {
                                let profile = profiles[0];
                                assert.equal(profile.claimsTourDone, true);
                                done();
                            });
                    })
            });
    });

});