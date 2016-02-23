define(['jquery', 'knockout', 'wysiwyg'],

    function ($, ko, wysiwyg) {
        'use strict';

        ko.bindingHandlers.wysiwygEditor = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                $(element).wysiwyg();
                var content = allBindings.get('wysiwygEditor');
                var isDisabled = allBindings.get('disable');
                $(element).html(content());

                // Listen to Observable > update DOM
                content.subscribe(function (val) {
                    $(element).html(val || '');
                })
                isDisabled.subscribe(function(val){
                    $(element).attr('readonly', val);
                });

                // Listen to DOM > update observable
                $(element).focusout(function () {
                    var txt = $(element).cleanHtml();
                    console.log(txt);
                    content(txt);
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                $(element).html(allBindings.get('wysiwygEditor')());
            }
        };
    }
);