// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([],
    function () {
        'use strict';

        var millisInADay = 86400000;
        var daysInWeek = 6;

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
                    return isDateAttr(key) ? new Date(Number(val)) : val;
                });
                function isDateAttr(key) {
                    return key.toLowerCase().search('date') >= 0;
                }
            };
        }

        function niceDate(date, includeTime) {
            if (includeTime === undefined) {
                includeTime = true;
            }
            if (date === undefined || date === null || date === '') {
                return 'None';
            }
            if (!(date instanceof Date)) {
                return date;
            }
            var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
            var dayNames   = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var dayName = dayNames[date.getDay()];
            var year = date.getFullYear() === new Date().getFullYear() ? '' : date.getFullYear();
            var time = date.getHours() + ':' + prefixZero(date.getMinutes());

            if (isToday(date)) {
                return includeTime ? 'Today ' + time : 'Today';
            } else if(isThisWeek(date)) {
                return includeTime ?  dayName + ' ' + time : dayName;
            } else if (includeTime) {
                return month + ' ' + day + ' ' + year + ' ' + time;
            } else {
                return month + ' ' + day + ' ' + year;
            }
        }

        function isThisWeek(date) {
            return date.getTime() >= startOfWeekInMillis() && date.getTime() <= endOfWeekInMillis();
        }

        function isToday(date) {
            var today = new Date();
            return date.getDate() === today.getDate() && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
        }

        function now() {
            return new Date();
        }

        function startOfToday() {
            return new Date(now().getFullYear(), now().getMonth(), now().getDate(), 0, 0);
        }

        function endOfToday() {
            return new Date(now().getFullYear(), now().getMonth(), now().getDate(), 23, 59, 59);
        }

        function startOfWeekInMillis() {
            return startOfToday().getTime() - (startOfToday().getDay() * millisInADay);
        }

        function endOfWeekInMillis() {
            return startOfToday().getTime() + ((daysInWeek - startOfToday().getDay()) * millisInADay);
        }

        function daysFromNowInMillis(numOfDays) {
            return startOfToday().getTime() + (numOfDays * millisInADay);
        }

        function isYesterdayOrBefore(date) {
            return date.getTime() < startOfToday().getTime();
        }

        return {
            'niceDate': niceDate,
            'toDatetimePickerFormat': toDatetimePickerFormat,
            'fromDatetimePickerFormat': fromDatetimePickerFormat,
            'enableJSONDateHandling': enableJSONDateHandling,
            'DATETIME_PICKER_FORMAT': 'm/d/Y H:i',
            'MILLIS_IN_A_DAY'       : millisInADay,
            'isYesterdayOrBefore'   : isYesterdayOrBefore,
            'startOfToday'          : startOfToday,
            'endOfToday'            : endOfToday,
            'now'                   : now,
            'startOfWeekInMillis'   : startOfWeekInMillis,
            'endOfWeekInMillis'     : endOfWeekInMillis,
            'daysFromNowInMillis'   : daysFromNowInMillis
        };
    });