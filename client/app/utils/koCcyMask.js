define(['jquery', 'knockout', 'KOMap'],

    function ($, ko, KOMap) {
        'use strict';

        ko.bindingHandlers.ccyMask = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                console.log(valueAccessor());
                let value = valueAccessor();
                $(element).mask("#,##0.00", {reverse: true});

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