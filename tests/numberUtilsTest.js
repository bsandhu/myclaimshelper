var assert = require('assert');
var numberUtils = require('./../server/shared/numberUtils.js');

describe('NumberUtils', function () {

    it('Must convert to ccy', function () {
        assert.equal(numberUtils.niceCCY(100), '$100');
        assert.equal(numberUtils.niceCCY(100.25), '$100.25');
        assert.equal(numberUtils.niceCCY(1.335 + 1.52 + 2.55), '$5.405');
    });

    it('Must make nice', function () {
        assert.equal(numberUtils.nice(100), '100');
        assert.equal(numberUtils.nice(100.25), '100.25');
        assert.equal(numberUtils.nice(1.335 + 1.52 + 2.55), '5.405');
        assert.equal(numberUtils.nice(2.4000000000000004), '2.4');
        assert.equal(numberUtils.nice(.4000000000000004), '0.4');
        assert.equal(numberUtils.nice(.4254), '0.425');
    });

});
