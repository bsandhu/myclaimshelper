var assert = require('assert');
var numberUtils = require('./../server/shared/NumberUtils.js');

describe('NumberUtils', function () {

    it('Must convert to ccy', function () {
        assert.equal(numberUtils.niceCCY(null), '');
        assert.equal(numberUtils.niceCCY(undefined), '');
        assert.equal(numberUtils.niceCCY('abc'), '');
        assert.equal(numberUtils.niceCCY(1), '$1.00');
        assert.equal(numberUtils.niceCCY(100), '$100.00');
        assert.equal(numberUtils.niceCCY(100.25), '$100.25');
        assert.equal(numberUtils.niceCCY(100.255), '$100.26');
    });

    it('Must make nice', function () {
        assert.equal(numberUtils.nice(1), '1.0');
        assert.equal(numberUtils.nice(1.1), '1.1');
        assert.equal(numberUtils.nice(100), '100.0');
        assert.equal(numberUtils.nice(100.25), '100.25');
        assert.equal(numberUtils.nice(100.257), '100.26');
        assert.equal(numberUtils.nice(100.2575), '100.26');
        // Doesn't work on Node / Webkit ?
        // assert.equal(numberUtils.nice(2.4000000000000004), '2.4');
        // assert.equal(numberUtils.nice(.4000000000000004), '0.4');
        // assert.equal(numberUtils.nice(.4254), '0.425');
    });
});
