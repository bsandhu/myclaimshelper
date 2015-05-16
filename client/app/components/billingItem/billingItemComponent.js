define(['knockout', 'KOMap', 'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

    function (ko, KOMap, viewHtml, BillingItem) {
        'use strict';

        function BillingItemVM(params) {
            console.log('Init BillingItemVM');

            console.assert(params.billingItem, 'Expecting billingItem param');
            this.billingItem = params.billingItem;
        }

        BillingItemVM.prototype.removeBillingItem = function (billingItem) {
            // No-op
        }

        return {viewModel: BillingItemVM, template: viewHtml};
    });
