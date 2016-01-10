define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'select2'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        /*
         * @See https://select2.github.io/
         */
        ko.bindingHandlers.select2 = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // Init jQuery
                var $select2Elem = $(element).select2();

                // Model observable
                var config = ko.utils.unwrapObservable(valueAccessor());
                var modelAttr = config.modelAttr;

                // TODO set value

                // Update model
                $select2Elem.on('change', function(ev){
                    console.log('Select2 value change: ' + $select2Elem.val());
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No-op
            }
        };
    }
);