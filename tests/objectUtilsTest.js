var assert = require('assert');
var objectUtils = require('./../server/shared/objectUtils.js');

describe('ObjectUtils', function () {

    it('Capitalize', function () {
        assert.equal(objectUtils.capitalize(''), '');
        assert.equal(objectUtils.capitalize(null), '');
        assert.equal(objectUtils.capitalize(undefined), '');
        assert.equal(objectUtils.capitalize('a'), 'A');
        assert.equal(objectUtils.capitalize('A'), 'A');
        assert.equal(objectUtils.capitalize('Aaaa'), 'Aaaa');
        assert.equal(objectUtils.capitalize('AaaB'), 'AaaB');
        assert.equal(objectUtils.capitalize('aa aB'), 'Aa aB');
    });
});
