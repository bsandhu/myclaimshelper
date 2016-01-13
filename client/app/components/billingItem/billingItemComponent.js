define(['knockout', 'KOMap',
        'app/utils/Session',
        'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

    function (ko, KOMap, Session, viewHtml, BillingItem) {
        'use strict';

        function BillingItemVM(params) {
            console.log('Init BillingItemVM');

            console.assert(params.billingItem, 'Expecting billingItem param');
            this.billingItem = params.billingItem;
            this.userProfile = Session.getCurrentUserProfile();
        }

        /**
         * Data setup for (Select2) codes widget
         */
        BillingItemVM.prototype.billingCodesDatasource = function (billingItem) {
            var ds = [];
            var codes = this.userProfile.billingProfile.codes.OutsideCodes;
            $.each(codes, function (code) {
                ds.push({id: code, text: codes[code]});
            });
            return ds;
        }

        BillingItemVM.prototype.removeBillingItem = function (billingItem) {
            // No-op
        }

        return {viewModel: BillingItemVM, template: viewHtml};
    });
