var assert = require("assert");
var Q = require("Q");
var mongoUtils = require("./../server/mongoUtils.js");

describe('Mongo Utils', function () {

    it('Must generate sequence', function (done) {
        var firstSeqNumber, secondSeqNumber;

        var firstCall = mongoUtils.incrementAndGet('TestSeq',
            function (val) {
                assert.ok(val >= 0);
                firstSeqNumber = val;
            });

        var secondCall = mongoUtils.incrementAndGet('TestSeq',
            function (val) {
                assert.ok(val >= 0);
                secondSeqNumber = val;
            });

        Q.fcall(firstCall)
            .then(secondCall)
            .then(function () {
                assert.equal(secondSeqNumber, firstSeqNumber + 1);
            })
            .then(done());
    });
});