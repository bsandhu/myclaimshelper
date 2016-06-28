define(['jquery', 'knockout', 'KOMap', 'app/utils/session', 'app/components/contact/contactClient'],

    function ($, ko, KOMap, Session, ContactClient) {
        'use strict';

        var icons = {
                'phone' : 'fa-phone',
                'visit' : 'fa-map-marker',
                'photos': 'fa-camera',
                'email' : 'fa-envelope',
                'other' : 'fa-tag'
        }

        ko.bindingHandlers.taskEntryTag = {

            currentTagClass : undefined,

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var tag = valueAccessor() || 'other';

                var tagStyle = 'taskTag fa ' + icons[tag];
                $(element).html('<i class="' + tagStyle + '"></i>');

                $(element).attr('myTitle', tag);
                $(element).css('font-size', 'medium');
                $(element).addClass('myTooltip');
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var tag = valueAccessor() || 'other';

                var tagStyle = 'taskTag fa ' + icons[tag];
                $(element).html('');
                $(element).html('<i class="' + tagStyle + '"></i>');
            }
        }
    }
)