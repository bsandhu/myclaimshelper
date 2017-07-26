let assert = require('assert');
let Form = require('./../../server/model/form.js');
let formService = require('./../../server/services/formService.js');
let profileService = require('./../../server/services/profileService.js');
let RefData = require('./../../server/model/refData.js');
let mongoUtils = require('./../../server/mongoUtils.js');


describe('FormService', function () {
    let testForm = new Form();
    testForm.type = 'proofOfLoss';
    testForm.claimId = '100';
    testForm.data = {"a": 100, "ba": 200};

    after(function (done) {
        assert.ok(testForm._id);
        mongoUtils.deleteEntity({_id: testForm._id}, mongoUtils.FORMDATA_COL_NAME)
            .done(done)
            .fail('Failed to cleanup test FormData');
    });

    it('Add new form', function (done) {
        let req = {
            body: testForm,
            headers: {userid: 'TestUser', group: profileService.DEFAULT_GROUP, ingroups: [profileService.DEFAULT_GROUP]}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            // Form instance
            let form = data.data;
            assert.ok(form);
            assert.equal(form.type, 'proofOfLoss');
            assert.equal(form.owner, 'TestUser');
            assert.equal(form.group, profileService.DEFAULT_GROUP);

            // Empty attrs for attrs not set on the Form
            let formData = data.data.data;
            assert.equal(formData.a, 100);
            assert.equal(formData.aa, "");
            assert.equal(formData.ba, 200);
            assert.equal(formData.ca, "");
            assert.equal(formData.da, "");
            done();
        };

        formService.addFormData(req, res);
    });

    it('Get form', function (done) {
        let req = {
            params: {id: testForm._id},
            headers: {userid: 'TestUser', ingroups: [profileService.DEFAULT_GROUP]}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');

            let form = data.data;
            assert.equal(form.type, 'proofOfLoss');
            assert.equal(form.owner, 'TestUser');
            assert.equal(form.claimId, '100');
            assert.ok(form.data);

            let formData = form.data;
            assert.equal(formData.a, 100);
            assert.equal(formData.aa, "");
            assert.equal(formData.ba, 200);
            assert.equal(formData.ca, "");
            assert.equal(formData.da, "");
            done();
        };
        formService.getFormData(req, res);
    });

    it('Delete form', function (done) {
        let req = {
            params: {id: testForm._id},
            headers: {userid: 'TestUser', ingroups: [profileService.DEFAULT_GROUP]}
        };
        let res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.equal(data.data.id, testForm._id);
            done();
        };

        formService.deleteForm(req, res);
    })
})