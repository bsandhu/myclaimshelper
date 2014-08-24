define(['jquery', 'knockout', 'KOMap', 'app/utils/dateUtils', 'datetimepicker'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        /*
         * @See http://xdsoft.net/jqplugins/datetimepicker/
         */
        ko.bindingHandlers.datetimePicker = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var config = ko.utils.unwrapObservable(valueAccessor());

                config.mask = DateUtils.DATETIME_PICKER_FORMAT;

                $(element).datetimepicker(config);
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No op
            }
        };
    }
);