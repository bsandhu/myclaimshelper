define(['jquery', 'knockout'],

    function ($, ko) {
        'use strict';

        var canvas = document.createElement("canvas");

        ko.bindingHandlers.textTruncate = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                setValue(element, allBindings);
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                setValue(element, allBindings);
            }
        };

        function setValue(element, allBindings) {
            try {
                var txtBinding = allBindings.get('textTruncate');
                var content = $.isFunction(txtBinding)
                    ? txtBinding()
                    : txtBinding;
                content = content || '-';
                var maxLengthInPercentage = allBindings.get('maxLength') || 10;

                var charLengthInPx = getTextWidth('a');
                var contentLengthInPx = charLengthInPx * content.length;
                var maxLengthInPx = ($(window).width() * maxLengthInPercentage) / 100;

                var maxChars = (maxLengthInPx / charLengthInPx) - 4;
                var shouldTruncate = contentLengthInPx > maxLengthInPx;
                var truncatedContent = shouldTruncate ? content.substr(0, maxChars) + '...' : content;

                $(element).html('<span>' + truncatedContent + '</span>');
                if (shouldTruncate) {
                    $(element).attr('myTitle', content);
                    $(element).addClass('myTooltip');
                }
            } catch (e) {
                console.error('Could not truncate text: ' + e);
            }
        }

        function getTextWidth(text) {
            var context = canvas.getContext("2d");
            var metrics = context.measureText(text);
            return metrics.width;
        }

    }
);