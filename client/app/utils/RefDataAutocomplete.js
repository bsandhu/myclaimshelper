define(['jquery', 'underscore', 'amplify', 'knockout', 'KOMap',
        'model/refData', 'app/utils/ajaxUtils'],

    function ($, _, amplify, ko, KOMap, RefData, AjaxUtils) {
        'use strict';

        ko.bindingHandlers.refDataAutoComplete = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                let refDataType = allBindings.get('type');
                let appendTo = allBindings.get('appendTo');

                $.getJSON('/refData/' + refDataType)
                    .then(function (data) {
                        setupWidget(data.data);
                    });

                let autoCompleteOpen = false;

                function setupWidget(companies) {
                    let dataSrc = $.map(companies, function (item) {
                        return item.text;
                    });

                    addComboBox();

                    let props = {
                        minLength: 0,
                        source: dataSrc,
                        open: function () {
                            autoCompleteOpen = true;
                        },
                        close: function () {
                            autoCompleteOpen = false;
                        },
                        change: function (event, ui) {
                            // Only handle cases where user typed in
                            if (ui.item != null) {
                                return;
                            }
                            // Get user entered value
                            let newValue = event.target.value;

                            let existingInDS = _.find(dataSrc, function (val) {
                                return newValue.toLowerCase() == val.toLowerCase()
                            });

                            let value = valueAccessor();
                            if (existingInDS) {
                                value(existingInDS);
                            } else {
                                addToRefData(newValue, dataSrc);
                                value(newValue);
                            }
                            console.log("Change: " + newValue);
                        },
                        select: function (event, ui) {
                            console.log("Selected: " + JSON.stringify(ui.item));
                            let value = valueAccessor();
                            value(ui.item.value);
                        }
                    };
                    if (appendTo) {
                        props.appendTo = appendTo;
                    }
                    $(element).autocomplete(props);
                    $(element).val(ko.unwrap(valueAccessor()));
                }

                function addComboBox() {
                    if (!$(element).parent().is('div')){
                        throw 'RefData autocomplete must have a container div as parent';
                    }

                    let comboArrow = document.createElement('div');
                    $(comboArrow).addClass('inline');
                    $(comboArrow).html('<a href="#" tabindex="-1"><i class="fa fa-sort-desc" style="top: -5px; position: relative"></i></a>');
                    $(comboArrow).click(function () {
                        if (autoCompleteOpen) {
                            $(element).autocomplete("close");
                        } else {
                            // Open
                            $(element).autocomplete("search", "");
                        }
                        return false;
                    });

                    let containerDiv = document.createElement('div');
                    $(element).parent().append(containerDiv);
                    $(element).addClass('no-border');
                    $(element).width($(element).width() - 17);

                    $(containerDiv).addClass('inline form-control noPadding');
                    $(containerDiv).append(element);
                    $(containerDiv).append(comboArrow);
                }

                function addToRefData(newValue, dataSrc) {
                    console.log('Adding new value: ' + newValue + ' to refData: ' + refDataType);

                    let refData = new RefData();
                    refData.type = refDataType;
                    refData.text = newValue;

                    AjaxUtils.post(
                        '/refData',
                        KOMap.toJSON(refData),
                        function onSuccess(response) {
                            dataSrc.push(newValue);
                        },
                        function onFail(response) {
                            console.log('Failure: ' + JSON.stringify(response));
                            amplify.publish(Events.FAILURE_NOTIFICATION, {msg: response.message});
                        }
                    );
                }
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No op
            }
        }
    }
)