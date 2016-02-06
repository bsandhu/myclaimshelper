define(['jquery', 'knockout', 'KOMap', 'app/utils/session', 'app/components/contact/contactClient'],

    function ($, ko, KOMap, Session, ContactClient) {
        'use strict';

        ko.bindingHandlers.taskEntryTag = {

            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var tag = valueAccessor();
                var icons = {
                    'phone' : 'fa-phone',
                    'visit' : 'fa-map-marker',
                    'photos': 'fa-camera',
                    'email' : 'fa-envelope',
                    'other' : 'fa-tag'
                }
                $(element).addClass('fa');
                $(element).addClass(icons[tag]);
                $(element).attr('title', tag);
                $(element).css('font-size', 'medium');
            },

            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // No op
            }
        }
    }
)