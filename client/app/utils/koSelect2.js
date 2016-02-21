define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'select2'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        /*
         * @See https://select2.github.io/
         */
        ko.bindingHandlers.select2 = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var data = allBindings.get('myoptions');

                // Init jQuery
                var select2Elem = $(element).select2({
                    data: data,
                    templateResult: format
                });
                $.data(element, 'select2Instance', select2Elem);

                // Set value
                var value = ko.utils.unwrapObservable(valueAccessor());
                select2Elem.val(value);

                // Update model
                select2Elem.on('change', function (ev) {
                    const newValue = select2Elem.val();
                    console.log('Select2 value change: ' + newValue);
                    var value = valueAccessor();
                    value(newValue);
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                $.data(element, 'select2Instance').val(value).trigger("change");
            }
        };
        function format(optionsObj) {
            return $('<span><strong>' + optionsObj.id + ' </strong>' + optionsObj.text + '</span>');
        };

    }
);