define(['jquery', 'knockout', 'KOMap'],

    function ($, ko, KOMap) {
        'use strict';

        ko.bindingHandlers.phoneMask = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                console.log(valueAccessor());
                let value = valueAccessor();
                $(element).mask('000-000-0000');

                $(element).focusout(()=>{
                    value($(element).val());
                })
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                console.log(valueAccessor());
                //No-op
            }
        };
    }
);