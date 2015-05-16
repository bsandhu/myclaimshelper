define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'datetimepicker', 'sortable'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        ko.bindingHandlers.sortable = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                Sortable.initTable(element);
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                //No-op
            }
        };
    }
);