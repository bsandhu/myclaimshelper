// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['jquery'],
    function ($) {

        function toDatetimePickerFormat(jsDate) {
            if (!jsDate instanceof Date) {
                throw 'Expecting JS Date. Got: ' + jsDate;
            }
            return prefixZero(jsDate.getMonth() + 1) + '/' +
                prefixZero(jsDate.getDate()) + '/' +
                jsDate.getFullYear() + ' ' +
                prefixZero(jsDate.getHours()) + ':' +
                prefixZero(jsDate.getMinutes());
        }

        function fromDatetimePickerFormat(dateAsStr) {
            // Example String: 01/01/2014 10:10

            var dmy = dateAsStr.split('/');
            var month = Number(dmy[0]) - 1;
            var date = Number(dmy[1]);
            var year = Number(dmy[2].split(' ')[0]);

            var time = dmy[2].split(' ')[1];
            var hours = Number(time.split(':')[0]);
            var mins = Number(time.split(':')[1]);
            return new Date(year, month, date, hours, mins);
        }

        /**
         * Stupid DatePicker need Jan. to be 01 instead of 1
         */
        function prefixZero(num) {
            num = num || 0;
            if (String(num).length >= 2) {
                return num;
            } else {
                return '0' + String(num);
            }
        }

        /**
         * Date -> JSON: Milli secs since epoch
         * JSON -> Date: Milli secs to JS Date
         */
        function enableJSONDateHandling() {

            // Override outgoing JSON Date parsing
            Date.prototype.toJSON = function () {
                return this.getTime();
            };

            // Override incoming JSON Date parsing
            var nativeJSONParse = JSON.parse;
            JSON.parse = function (data) {
                console.log('Parsing ' + data);
                return nativeJSONParse(data, function dateHandle(key, val) {
                    if (key.substring(key.length - 4, key.length).toLowerCase() === 'date') {
                        return new Date(Number(val));
                    } else {
                        return val;
                    }
                });
            };
        }

        return {
            'toDatetimePickerFormat'  : toDatetimePickerFormat,
            'fromDatetimePickerFormat': fromDatetimePickerFormat,
            'enableJSONDateHandling'  : enableJSONDateHandling,
            'DATETIME_PICKER_FORMAT'  : 'm/d/Y H:i'
        };
    });