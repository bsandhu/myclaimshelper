var statsService = require("./../../server/services/statsService");
var mongoUtils = require("./../../server/mongoUtils.js");

var assert = require("assert");
var jQuery = require('jquery-deferred');

describe('statsService', function () {

    it('getAllStatsREST ok', function (done) {
        var req = {};
        var res = {};
        res.json = function (data) {
            assert(data);
            assert.equal(data.status, 'Success');
            assert.ok(data.data);
            console.log('data.data: ' + data.data);
            done();
        };
        statsService.getAllStatsREST(req, res);
    });
})