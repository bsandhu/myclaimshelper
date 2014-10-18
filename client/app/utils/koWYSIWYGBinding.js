define(['jquery', 'knockout', 'wysiwyg'],

    function ($, ko, wysiwyg) {
        'use strict';

        ko.bindingHandlers.wysiwygEditor = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                $(element).wysiwyg();
                var content = allBindings.get('wysiwygEditor');
                $(element).html(content());

                // Listen to DOM and update observable
                $(element).bind("DOMSubtreeModified",function(){
                    content($(element).cleanHtml());
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // Update DOM
                $(element).html(allBindings.get('wysiwygEditor')());
            }
        };
    }
);