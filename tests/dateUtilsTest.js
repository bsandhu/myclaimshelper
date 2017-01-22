var assert = require('assert');
var dateUtils = require('./../server/shared/dateUtils.js');

var toStr = dateUtils.toDatePickerFormat;
var toTimeStr = dateUtils.toTimePickerFormat;
var toDate = dateUtils.fromDatetimePickerFormat;


describe('DateUtils', function () {

    it('Must convert to DatePicker toStr', function () {
        // JS month is 0 indexed
        assert.equal(toStr(new Date(2014, 8, 22)), '09/22/2014');
        assert.equal(toStr(new Date(2014, 8, 22)), '09/22/2014');
        assert.equal(toStr(new Date(2014, 0, 1)), '01/01/2014');
        assert.equal(toStr(new Date(2014, 11, 1)), '12/01/2014');

        assert.equal(toStr(new Date(2014, 8, 22, 10, 10)), '09/22/2014');
        assert.equal(toStr(new Date(2014, 8, 22, 15, 50)), '09/22/2014');
        assert.equal(toStr(new Date(2014, 0, 1, 12, 32)), '01/01/2014');
    });

    it('Must convert to TimePicker toStr', function () {
        assert.equal(toTimeStr(new Date(2014, 8, 22, 8, 5)), '08:05');
        assert.equal(toTimeStr(new Date(2014, 8, 22, 0, 0)), '00:00');
        assert.equal(toTimeStr(new Date(2014, 8, 22, 10, 10)), '10:10');
        assert.equal(toTimeStr(new Date(2014, 8, 22, 15, 50)), '15:50');
        assert.equal(toTimeStr(new Date(2014, 0, 1, 12, 32)), '12:32');
    });

    it('Must convert FROM DatePicker toStr', function () {
        // JS month is 0 indexed
        assert.equal(toDate('09/22/2014 00:00').getTime(), new Date(2014, 8, 22, 0, 0).getTime());
        assert.equal(toDate('09/22/2014 00:00').getTime(), new Date(2014, 8, 22, 0, 0).getTime());
        assert.equal(toDate('01/01/2014 00:00').getTime(), new Date(2014, 0, 1, 0, 0).getTime());
        assert.equal(toDate('09/22/2014 10:10').getTime(), new Date(2014, 8, 22, 10, 10).getTime());
    });

    it('Must convert FROM DatePicker toStr', function () {
        dateUtils.enableJSONDateHandling();

        var obj = JSON.parse("{\"dueDate\": 1391230800000}");
        assert.ok(obj.dueDate instanceof Date);
        assert.equal(obj.dueDate.getMonth(), 1);
        assert.equal(obj.dueDate.getDate(), 1);
        assert.equal(obj.dueDate.getFullYear(), 2014);

        obj = JSON.parse("{\"dateReceived\": 1391230800000}");
        assert.ok(obj.dateReceived instanceof Date);
        assert.equal(obj.dateReceived.getMonth(), 1);
        assert.equal(obj.dateReceived.getDate(), 1);
        assert.equal(obj.dateReceived.getFullYear(), 2014);
    });

    it('Make nice date', function () {
        assert.equal(dateUtils.niceDate(new Date(2017, 0, 2, 10, 10)), 'Jan 2  10:10');
        assert.equal(dateUtils.niceDate(new Date(2017, 8, 20, 10, 10)), 'Sep 20  10:10');
        assert.equal(dateUtils.niceDate(new Date(2014, 8, 20, 10, 10)), 'Sep 20 2014 10:10');
        assert.equal(dateUtils.niceDate(undefined), 'None');
        assert.equal(dateUtils.niceDate(null), 'None');
        assert.equal(dateUtils.niceDate(new Date(0)), 'None');

        var today = dateUtils.niceDate(new Date());
        assert.ok(today.toLowerCase().search('today') >= 0);
    });

    it('Make nice date without time', function () {
        assert.equal(dateUtils.niceDate(new Date(2015, 0, 2, 0, 0)), 'Jan 2 2015');
        assert.equal(dateUtils.niceDate(new Date(2017, 0, 2, 0, 0)), 'Jan 2');
        assert.equal(dateUtils.niceDate(new Date(2017, 8, 20, 0, 0)), 'Sep 20');
    });

    it('IsYesterdayOrBefore', function () {
        assert.equal(dateUtils.isYesterdayOrBefore(new Date()), false);
        assert.equal(dateUtils.isYesterdayOrBefore(new Date(new Date().getTime() - dateUtils.MILLIS_IN_A_DAY)), true);
    });

    it('NiceLocaleDate', function () {
        assert.equal(dateUtils.niceLocaleDate(null), 'None');
        assert.equal(dateUtils.niceLocaleDate(null, 'Foo'), 'Foo');
        assert.equal(dateUtils.niceLocaleDate(new Date(0)), 'None');
        assert.equal(dateUtils.niceLocaleDate(new Date(2015, 2, 1)), '3/1/2015');
    });

    it('startOfToday', function () {
        assert.ok(dateUtils.startOfToday() instanceof Date);
        assert.equal(dateUtils.startOfToday().getHours(), 0);
        assert.equal(dateUtils.startOfToday().getMinutes(), 0);
        assert.equal(dateUtils.startOfToday().getSeconds(), 0);
    })

});