define(['jquery', 'knockout', 'KOMap', 'shared/dateUtils', 'datetimepicker'],

    function ($, ko, KOMap, DateUtils) {
        'use strict';

        ko.bindingHandlers.sortable = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                Sortable.initTable(document.querySelector('#billingListTable'));
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                //No-op
            }
        };
    }
);