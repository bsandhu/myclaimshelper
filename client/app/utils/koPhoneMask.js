define(['jquery', 'knockout', 'KOMap'],

    function ($, ko, KOMap) {
        'use strict';

        ko.bindingHandlers.phoneMask = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                console.log(valueAccessor());
                let value = valueAccessor();
                $(element).mask("999-999-9999");

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