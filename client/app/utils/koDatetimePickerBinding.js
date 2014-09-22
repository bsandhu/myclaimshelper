define(['jquery', 'knockout', 'KOMap', 'app/utils/dateUtils', 'datetimepicker'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        /*
         * @See http://xdsoft.net/jqplugins/datetimepicker/
         */
        ko.bindingHandlers.datetimePicker = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var config = ko.utils.unwrapObservable(valueAccessor());

                config.mask = true;
                config.format = DateUtils.DATETIME_PICKER_FORMAT;

                $(element).datetimepicker(config);

                // Set the observable back as Date object
                $(element).change(function(){
                    console.log('Date selection: ' + $(element).val());
                    config.dateValue(DateUtils.fromDatetimePickerFormat($(element).val()));
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var config = ko.utils.unwrapObservable(valueAccessor());

                // Set the observable date as String
                var boundDate = config.dateValue && config.dateValue() || new Date();
                $(element).val(DateUtils.toDatetimePickerFormat(boundDate));
            }
        };
    }
);