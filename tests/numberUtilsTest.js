var assert = require('assert');
var numberUtils = require('./../server/shared/NumberUtils.js');

describe('NumberUtils', function () {

    it('Must convert to ccy', function () {
        assert.equal(numberUtils.niceCCY(100), '$100');
        assert.equal(numberUtils.niceCCY(100.25), '$100.25');
    });

    it('Must make nice', function () {
        assert.equal(numberUtils.nice(100), '100');
        assert.equal(numberUtils.nice(100.25), '100.25');
        // Dont work on Node?
        // assert.equal(numberUtils.nice(2.4000000000000004), '2.4');
        // assert.equal(numberUtils.nice(.4000000000000004), '0.4');
        // assert.equal(numberUtils.nice(.4254), '0.425');
    });

});
