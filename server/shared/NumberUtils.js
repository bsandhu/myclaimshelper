// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([],
    function () {
        'use strict';

        function niceCCY(ccy){
            if (ccy == null || ccy == undefined || isNaN(ccy)) {
                return '';
            }
            return '$' + Number(ccy).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }

        function nice(ccy){
            if (ccy == null || ccy == undefined || isNaN(ccy)) {
                return '';
            }
            return Number(ccy).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 2});
        }

        return {
            'niceCCY': niceCCY,
            'nice': nice
        }
    }
)