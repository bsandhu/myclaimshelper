define(['jquery', 'knockout', 'underscore', 'KOMap', 'shared/dateUtils', 'select2'],

    function ($, ko, _, KOMap, DateUtils) {
        /*
         * @See https://select2.github.io/
         */
        ko.bindingHandlers.select2 = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var data = allBindings.get('myoptions')

                // Init jQuery
                var select2Elem = $(element).select2({
                    data: data,
                    templateResult: format,
                    selectOnClose: true,
                    matcher: function(term, text) {
                        if (term && term.term && term.term.length > 0) {
                            // Match on Id or Text
                            // Return matching items
                            var matches = _.filter(text.children, function(option){
                                return (option.id.indexOf(term.term) >=0) ||
                                        (option.text.indexOf(term.term) >=0);
                            });
                            var result = _.extend({}, text);
                            result.children = matches;
                            return result;
                        } else {
                            return text;

                        }
                    }
                });
                $.data(element, 'select2Instance', select2Elem);

                // Set value
                var value = ko.utils.unwrapObservable(valueAccessor());
                select2Elem.val(value);

                // Update model
                select2Elem.on('change', function (ev) {
                    const newValue = select2Elem.val();
                    var value = valueAccessor();
                    value(newValue);
                });
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                $.data(element, 'select2Instance').val(value).trigger("change");
            }
        };
        function format(optionsObj) {
            return $('<span><strong>' + optionsObj.id + ' </strong>' + optionsObj.text + '</span>');
        };

    }
);