let statsService = require("./../../server/services/statsService");
let mongoUtils = require("./../../server/mongoUtils.js");

let assert = require("assert");
let jQuery = require('jquery-deferred');
let _ = require('underscore');


describe('statsService', function () {

    it('getAllStatsREST ok', function (done) {
        let req = {headers: {userid: 'testuser1', ingroups: ['testuser1']}};
        let res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            console.log('data.data: ' + JSON.stringify(data.data));

            // check expected keys
            assert.ok(data.data.TasksDoneToday);
            assert.ok(data.data.OpenClaims);

            // Check min expected keys
            assert.ok(data.data.ClosedClaims);
            assert.ok(_.keys(data.data.ClosedClaims).length >= 3);
            done();
        };
        statsService.getAllStatsREST(req, res);
    });

})