// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([],
    function () {
        'use strict';

        /**
         * See ClaimListVM for usage - binds 'this' so we eval in the right context
         */
        function nullsafe(expr, defaultVal) {
            defaultVal = defaultVal || '';
            try {
                return eval(expr) || defaultVal;
            } catch (e) {
                return defaultVal;
            }
        }

        function capitalize(expr) {
            expr = expr || '';
            expr = String(expr);
            return expr.charAt(0).toUpperCase() + expr.substr(1);
        }

        function defaultValue(obj, defaultVal) {
            if (obj == undefined || obj == null) {
                return defaultVal;
            } else {
                return obj;
            }
        }

        function isBlank(obj) {
            return (!obj || String(obj).trim() === "");
        };

        return {
            'nullSafe': nullsafe,
            'capitalize': capitalize,
            'defaultValue': defaultValue,
            'isBlank': isBlank
        }
    }
)