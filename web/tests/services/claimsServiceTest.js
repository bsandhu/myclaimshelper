var assert = require("assert");
var claimsService = require("./../../server/services/claimsService.js");
var claim = require("./../../server/model/claim.js");

describe('Claims Service', function () {

    var testClaim = new claim.Claim();
    testClaim.description = 'Test claim';

    var task = new claim.Task();
    task.entryDate = new Date(2014, 1, 1);
    task.dueDate = new Date(2014, 1, 10);
    task.summary = "I am test Task";

    testClaim.tasks = [task];

    it('Save claim', function (done) {
        var req = {};
        req.body = testClaim;
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testClaim._id);
            done();
        };
        claimsService.saveClaim(req, res, 'Claims');
    });

    it('Update claim', function (done) {
        var newTask = new claim.Task();
        newTask.entryDate = new Date(2014, 2, 1);
        newTask.dueDate = new Date(2014, 2, 10);
        newTask.summary = "I am test Task too";

        testClaim.description = 'Test claim update';
        testClaim.tasks.push(newTask);
        // Mimic the input from the browser
        testClaim._id = testClaim._id.toString();

        var req = {body: testClaim};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(testClaim._id);
            done();
        };
        claimsService.saveClaim(req, res, 'Claims');
    });

    it('Get a Claim', function (done) {
        var req = {params: {}};
        req.params.id = testClaim._id;

        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            var savedClaim = data.data;
            assert.equal(savedClaim.description, 'Test claim update');
            assert.equal(savedClaim.tasks.length, 2);
            done();
        };
        claimsService.getClaim(req, res);
    })

    it('Get All', function (done) {
        var req = {};
        var res = {};

        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert(data.data.length >= 1);
            done();
        };

        claimsService.getAllClaims(req, res);
    });
});