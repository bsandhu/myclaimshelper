// This module is tested using the Node mocha test runner
// This snippet allows loading by the server
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([],
    function () {
        'use strict';

        function niceCCY(ccy){
            if (Number(ccy) === NaN) {
                return '';
            }
            return '$' + Number(ccy).toFixed(2);
        }

        return {
            'niceCCY': niceCCY,
        }
    }
)