define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'datetimepicker'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        /*
         * @See http://xdsoft.net/jqplugins/datetimepicker/
         */
        ko.bindingHandlers.datetimePicker = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var config = ko.utils.unwrapObservable(valueAccessor());
                var showTime = config.timepicker;

                // Should timepicker be shown as input or icon?
                var showTimeLink = config.timepicker;

                // Do not show timepicker icon or input
                var hideTimepicker = config.hideTimepicker != undefined
                    ? config.hideTimepicker
                    : false;

                if (!$(element).parent().is('div')){
                    throw 'Datetime picker must have a container div as parent';
                }

                // Config for DatePicker lib
                config.mask = true;
                config.datepicker = true;
                config.timepicker = false;
                config.format = DateUtils.DATE_PICKER_FORMAT;
                $(element).datetimepicker(config);

                // Config for TimePicker lib
                var configForTimepicker = $.extend({}, config);
                configForTimepicker.datepicker = false;
                configForTimepicker.timepicker = true;
                configForTimepicker.format = DateUtils.TIME_PICKER_FORMAT;

                // Modify DOM to show time picker
                var addTimeLink = document.createElement('div');
                $(addTimeLink).addClass('inline addTimeLink');
                $(addTimeLink).html('<a href="#"><i class="fa fa-clock-o" style="font-size: 1.3em"></i></a>');
                $(addTimeLink).click(function () {
                    showTimeInput();
                    return false;
                });

                var hideTimeLink = document.createElement('div');
                $(hideTimeLink).html('<a href="#"><i class="fa fa-times"></i></a>');
                $(hideTimeLink).addClass('inline leftMargin5 hideTimeLink');
                $(hideTimeLink).click(function () {
                    hideTimeInput();
                    return false;
                });

                var timePickerInput = document.createElement('input');
                $(timePickerInput).addClass('form-control narrowest input-sm timePickerInput');

                var timePickerDiv = document.createElement('div');
                $(timePickerDiv).addClass('inline timePickerDiv');
                $(timePickerDiv).append(timePickerInput);
                // Time picker init
                $(timePickerInput).datetimepicker(configForTimepicker);
                $(timePickerInput).val(DateUtils.DEFAULT_TIME_VALUE);

                var containerDiv = document.createElement('div');
                $(containerDiv).addClass('inline leftMargin5');
                $(containerDiv).append(timePickerDiv);
                $(containerDiv).append(hideTimeLink);
                $(containerDiv).append(addTimeLink);

                $(element).parent().append(containerDiv);

                if (hideTimepicker) {
                    hideTimepickerIconAndInput();
                } else {
                    showTime
                        ? showTimeInput()
                        : hideTimeInput();
                }

                // Listeners
                $(timePickerInput).change(function () {
                    console.log('Time selection: ' + $(timePickerInput).val());
                    updateModelObservable();
                });

                $(element).change(function () {
                    console.log('Date selection: ' + $(element).val());
                    updateModelObservable();
                });

                // Convert to Date obj and set on observable
                function updateModelObservable() {
                    var dateAsStr = $(element).val();
                    var timeAsStr = $(timePickerInput).val();
                    var dateTimeAsStr = dateAsStr + ' ' + timeAsStr;
                    config.dateValue(DateUtils.fromDatetimePickerFormat(dateTimeAsStr));
                }

                function hideTimeInput(){
                    $(addTimeLink).show();
                    $(hideTimeLink).hide();
                    $(timePickerDiv).hide();
                }

                function showTimeInput(){
                    $(addTimeLink).hide();
                    $(hideTimeLink).show();
                    $(timePickerDiv).show();
                }

                function hideTimepickerIconAndInput(){
                    $(addTimeLink).hide();
                    $(hideTimeLink).hide();
                    $(timePickerDiv).hide();
                }
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                let config = ko.utils.unwrapObservable(valueAccessor());

                // Set the observable date as String
                let boundDate = config.dateValue && config.dateValue();
                if (boundDate && boundDate != null){
                    $(element).val(DateUtils.toDatePickerFormat(boundDate));
                    $(element).parent().find('.timePickerInput').val(DateUtils.toTimePickerFormat(boundDate));
                }
            }
        };
    }
);