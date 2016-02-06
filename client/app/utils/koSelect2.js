define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'select2'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        var $select2Elem;

        /*
         * @See https://select2.github.io/
         */
        ko.bindingHandlers.select2 = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var data = allBindings.get('myoptions');

                // Init jQuery
                $select2Elem = $(element).select2({
                    data: data,
                    templateResult: format
                });

                // Set value
                var value = ko.utils.unwrapObservable(valueAccessor());
                $select2Elem.val(value);

                // Update model
                $select2Elem.on('change', function (ev) {
                    const newValue = $select2Elem.val();
                    console.log('Select2 value change: ' + newValue);
                    var value = valueAccessor();
                    value(newValue);
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                console.log('Update');
                var value = ko.utils.unwrapObservable(valueAccessor());
                $select2Elem.val(value).trigger("change");
            }
        };

        function format(optionsObj) {
            return $('<span><strong>' + optionsObj.id + ' </strong>' + optionsObj.text + '</span>');
        };

    }
);