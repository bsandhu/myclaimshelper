define(['jquery', 'knockout', 'datatables'],

    function ($, ko, datatables) {
        ko.bindingHandlers.dataTable = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var binding = ko.utils.unwrapObservable(valueAccessor());

                // If the binding is an object with an options field,
                // initialise the dataTable with those options.
                if (!binding.options) {
                    console.error('Expecting options attribute');
                    return;
                }
                $(element).dataTable(binding.options());
                return { controlsDescendantBindings: true }
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // If the binding isn't an object, turn it into one.
                var binding = ko.utils.unwrapObservable(valueAccessor());
                if (!binding.data) {
                    console.error('Expecting data attribute');
                }

                if (binding.data().length > 0) {
                    var table = $(element).DataTable();
                    table.clear();
                    $.each(binding.data(), function(index, rowData){
                        table.row.add(rowData).draw();
                    });
                }
            }
        };
    })