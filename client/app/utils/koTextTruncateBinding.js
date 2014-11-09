define(['jquery', 'knockout'],

    function ($, ko) {
        'use strict';

        ko.bindingHandlers.textTruncate = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                setValue(element, allBindings);
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                setValue(element, allBindings);
            }
        };

        function setValue(element, allBindings) {
            var content = allBindings.get('textTruncate')()|| '';
            var maxLength = allBindings.get('maxLength') || 10;
            var truncatedContent = content.length > maxLength ? content.substr(0, maxLength) + '...' : content;
            $(element).html(truncatedContent);
            $(element).attr('title', content);
        }
    }
);