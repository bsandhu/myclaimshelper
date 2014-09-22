var assert = require('assert');
var dateUtils = require('./../client/app/utils/dateUtils.js');

var toStr = dateUtils.toDatetimePickerFormat;
var toDate = dateUtils.fromDatetimePickerFormat;


describe('DateUtils', function () {

    it('Must convert to DatePicker toStr', function () {
        // JS month is 0 indexed
        assert.equal(toStr(new Date(2014, 8, 22)), '09/22/2014 00:00');
        assert.equal(toStr(new Date(2014, 8, 22)), '09/22/2014 00:00');
        assert.equal(toStr(new Date(2014, 0, 1)),  '01/01/2014 00:00');
        assert.equal(toStr(new Date(2014, 11, 1)), '12/01/2014 00:00');

        assert.equal(toStr(new Date(2014, 8, 22, 10, 10)), '09/22/2014 10:10');
        assert.equal(toStr(new Date(2014, 8, 22, 15, 50)), '09/22/2014 15:50');
        assert.equal(toStr(new Date(2014, 0, 1, 12, 32)),  '01/01/2014 12:32');
    });

    it ('Must convert FROM DatePicker toStr', function(){
        // JS month is 0 indexed
        assert.equal(toDate('09/22/2014 00:00').getTime(), new Date(2014, 8, 22, 0, 0).getTime());
        assert.equal(toDate('09/22/2014 00:00').getTime(), new Date(2014, 8, 22, 0, 0).getTime());
        assert.equal(toDate('01/01/2014 00:00').getTime(), new Date(2014, 0, 1, 0, 0).getTime());
        assert.equal(toDate('09/22/2014 10:10').getTime(), new Date(2014, 8, 22, 10, 10).getTime());
    });
});