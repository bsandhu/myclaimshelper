define(['knockout', 'KOMap', 'amplify',
        'app/utils/events', 'app/utils/session',
        'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

    function (ko, KOMap, amplify, Events, Session, viewHtml, BillingItem) {
        'use strict';

        function BillingItemVM(params) {
            console.log('Init BillingItemVM');

            console.assert(params.billingItem, 'Expecting billingItem param');
            this.billingItem = params.billingItem;
            this.isDisabled = params.disable;
            this.billingItem().mileageCode.subscribe(function(newVal){
                this.billingItem().timeCode(newVal);
            }, this);

            // We are ready to render when billing codes (in user profile) are available (after login)
            this.readyToRender = ko.observable(false);
            this.userProfile = Session.getCurrentUserProfile();
            if (!this.userProfile) {
                amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                    this.userProfile = Session.getCurrentUserProfile();
                    this.readyToRender(true);
                });
            } else {
                this.readyToRender(true);
            }
        }

        /**
         * Data setup for (Select2) codes widget
         */
        BillingItemVM.prototype.billingCodesDatasource = function () {
            var allCodeGroups = this.userProfile.billingProfile.codes;
            var data = [];
            $.each(allCodeGroups, function (codeGroup){
                data.push({id: '', text: "-------- " + codeGroup + " --------", children: toSelect2Format(allCodeGroups[codeGroup])})
            });
            return data;
        }

        function toSelect2Format(codes) {
            var ds = [];
            $.each(codes, function (code) {
                ds.push({id: code, text: codes[code]});
            });
            return ds;
        }

        BillingItemVM.prototype.removeBillingItem = function (billingItem) {
            // No-op
        }

        return {viewModel: BillingItemVM, template: viewHtml};
    })
;
