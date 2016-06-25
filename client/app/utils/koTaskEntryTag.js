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

                $(element).addClass('taskTag');
                $(element).addClass('fa');
                $(element).addClass(icons[tag]);
                $(element).attr('title', tag);
                $(element).css('font-size', 'medium');
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var tag = valueAccessor() || 'other';

                $.each(icons, function(k, v){
                    $(element).removeClass(v);
                })
                $(element).addClass(icons[tag]);
            }
        }
    }
)