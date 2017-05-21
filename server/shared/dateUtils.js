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

        function toDatePickerFormat(jsDate) {
            if (!jsDate instanceof Date) {
                throw 'Expecting JS Date. Got: ' + jsDate;
            }
            return prefixZero(jsDate.getMonth() + 1) + '/' +
                prefixZero(jsDate.getDate()) + '/' +
                jsDate.getFullYear();
        }

        function toTimePickerFormat(jsDate) {
            if (!jsDate instanceof Date) {
                throw 'Expecting JS Date. Got: ' + jsDate;
            }
            return prefixZero(jsDate.getHours()) + ':' +
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
                    return isDateAttr(key) && Number(val) ? new Date(Number(val)) : val;
                });
                function isDateAttr(key) {
                    return key.toLowerCase().search('date') >= 0;
                }
            };
        }

        function niceDate(date, includeTime, defaultValue) {
            if (includeTime === undefined) {
                includeTime = true;
            }
            if (date === undefined || date === null || date === '') {
                return defaultValue || 'None';
            }
            if (!(date instanceof Date)) {
                return date;
            }
            if(date.getTime() == 0){
                return defaultValue || 'None'
            }
            var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
            var dayNames   = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var dayName = dayNames[date.getDay()];
            var year = date.getFullYear() === new Date().getFullYear() ? '' : date.getFullYear();
            var time = date.getHours() + ':' + prefixZero(date.getMinutes());

            // Drop time if 0:00
            includeTime = (time === '00:00' || time === '0:00') ? false : includeTime;
            var result = '';

            if (isToday(date)) {
                result = includeTime ? 'Today ' + time : 'Today';
            } else if(isThisWeek(date)) {
                result = includeTime ?  dayName + ' ' + time : dayName;
            } else if (includeTime) {
                result = month + ' ' + day + ' ' + year + ' ' + time;
            } else {
                result = String(year).length > 0
                            ? month + ' ' + day + ' ' + year
                            : month + ' ' + day;
            }
            return result;
        }

        function niceLocaleDate(date, displayIfInvalidDate, hideYear) {
            displayIfInvalidDate = displayIfInvalidDate || 'None';
            hideYear = hideYear || false;

            if (date === undefined || date === null || date === '' || date.getTime() == 0) {
                return displayIfInvalidDate;
            }
            return hideYear
                    ? prefixZero(date.getMonth()+1) + '/' + prefixZero(date.getDate())
                    : prefixZero(date.getMonth()+1) + '/' + prefixZero(date.getDate()) + '/' + date.getFullYear() ;
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

        function startOfTodayUTC() {
            return new Date(now().getUTCFullYear(), now().getUTCMonth(), now().getUTCDate(), 0, 0);
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

        function daysBeforeNowInMillis(numOfDays) {
            return startOfToday().getTime() - (numOfDays * millisInADay);
        }

        function isYesterdayOrBefore(date) {
            return date.getTime() < startOfToday().getTime();
        }

        function stripTime(date){
            if (!(date instanceof Date)) {
                return date;
            }
            var withoutTime = new Date(date.getTime());
            withoutTime.setHours(0, 0, 0, 0);
            return withoutTime;
        }

        return {
            'niceDate'              : niceDate,
            'stripTime'             : stripTime,
            'niceLocaleDate'        : niceLocaleDate,
            'toDatePickerFormat'    : toDatePickerFormat,
            'toTimePickerFormat'    : toTimePickerFormat,
            'fromDatetimePickerFormat'  : fromDatetimePickerFormat,
            'enableJSONDateHandling'    : enableJSONDateHandling,
            'DATE_PICKER_FORMAT'    : 'm/d/Y',
            'TIME_PICKER_FORMAT'    : 'H:i',
            'DEFAULT_TIME_VALUE'    : '09:00',
            'MILLIS_IN_A_DAY'       : millisInADay,
            'isYesterdayOrBefore'   : isYesterdayOrBefore,
            'startOfToday'          : startOfToday,
            'startOfTodayUTC'       : startOfTodayUTC,
            'endOfToday'            : endOfToday,
            'now'                   : now,
            'startOfWeekInMillis'   : startOfWeekInMillis,
            'endOfWeekInMillis'     : endOfWeekInMillis,
            'daysFromNowInMillis'   : daysFromNowInMillis,
            'daysBeforeNowInMillis' : daysBeforeNowInMillis
        };
    });