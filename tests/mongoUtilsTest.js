let assert = require('assert');
let mongoUtils = require('./../server/mongoUtils.js');

describe('MongoUtils', function () {

    it('Must generate sequence', function (done) {
        let firstSeqNumber, secondSeqNumber;

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
                try {
                    secondSeqNumber = seqNum;
                    assert.equal(secondSeqNumber, firstSeqNumber + 1);
                } finally {
                    done();
                }
            });
    });

    it('Must parse ingroups', () => {
        assert.ok(mongoUtils.toArray('baljeet.mail').indexOf('baljeet.mail') >= 0);
        assert.ok(mongoUtils.toArray('baljeet.mail,DefaultGroup').indexOf('DefaultGroup') >= 0);
        assert.ok(mongoUtils.toArray('baljeet.mail,DefaultGroup').indexOf('baljeet.mail') >= 0);
    });

    it('Must add headers', () => {
        let req = {headers: {userid: 'TestOwner', group: 'TestGroup', ingroups: 'TestGroup'}};
        let dest = {};
        dest = mongoUtils.addOwnerInfo(req, dest);

        assert.equal(dest.owner, 'TestOwner');
        assert.equal(dest.group, 'TestGroup');
        assert.equal(dest.ingroups.length, 2);
    });

    it('Must check id validity', () => {
        assert.equal(mongoUtils.isEntityIdValid({}), false);
        assert.equal(mongoUtils.isEntityIdValid({_id: null}), false);
        assert.equal(mongoUtils.isEntityIdValid({_id: undefined}), false);
        assert.equal(mongoUtils.isEntityIdValid({_id: ''}), false);
        assert.equal(mongoUtils.isEntityIdValid({_id: ' '}), false);
        assert.equal(mongoUtils.isEntityIdValid({_id: '-1'}), false);

        assert.equal(mongoUtils.isEntityIdValid({_id: '1'}), true);
        assert.equal(mongoUtils.isEntityIdValid({_id: 1}), true);
        assert.equal(mongoUtils.isEntityIdValid({_id: 'TestUser1488733445693'}), true);
    });
});