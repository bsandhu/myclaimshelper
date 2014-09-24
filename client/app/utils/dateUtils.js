// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([],
    function () {

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
                return nativeJSONParse(data, function dateHandle(key, val) {
                    return endWithDate(key) ? new Date(Number(val)) : val;
                });
                function endWithDate(key) {
                    return key.substring(key.length - 4, key.length).toLowerCase() === 'date';
                }
            };
        }

        function niceDate(date) {
            if (date === undefined || date === null) {
                return '';
            }
            if (!(date instanceof Date)) {
                return date;
            }
            var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var year = date.getFullYear() === new Date().getFullYear() ? '' : date.getFullYear();
            var time = date.getHours() + ':' + prefixZero(date.getMinutes());
            return month + ' ' + day + ' ' + year + ' ' + time;
        }

        function isEqualIgnoringTime(date1, date2) {
            // Empty values are equal
            if ((date1 === null || date1 === undefined || date1 === '') &&
                (date2 === null || date2 === undefined || date2 === '')) {
                return true;
            }
            // Dates ignore time component
            if ((date1 instanceof Date) && (date2 instanceof Date)){
                return date1.getMonth() === date2.getMonth() &&
                       date1.getDate() === date2.getDate() &&
                       date1.getFullYear() === date2.getFullYear();
            }
            return date1 === date2;
        }

        return {
            'niceDate'                : niceDate,
            'toDatetimePickerFormat'  : toDatetimePickerFormat,
            'fromDatetimePickerFormat': fromDatetimePickerFormat,
            'enableJSONDateHandling'  : enableJSONDateHandling,
            'isEqualIgnoringTime'    : isEqualIgnoringTime,
            'DATETIME_PICKER_FORMAT'  : 'm/d/Y H:i'
        };
    });