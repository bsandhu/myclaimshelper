var assert = require('assert');
var mongoUtils = require('./../server/mongoUtils.js');

describe('MongoUtils', function () {

    it('Must generate sequence', function (done) {
        var firstSeqNumber, secondSeqNumber;

        function createSeqNum() {
            return mongoUtils.incrementAndGet('TestSeq');
        }

        createSeqNum()
            .then(function (seqNum) {
                firstSeqNumber = seqNum;
                assert.ok(seqNum >= 0);
            })
            .then(createSeqNum)
            .then(function (seqNum) {
                secondSeqNumber = seqNum;
                assert.equal(secondSeqNumber, firstSeqNumber + 1);
                done();
            });
    });
});