define(['knockout', 'KOMap', 'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

    function (ko, KOMap, viewHtml, BillingItem) {
        'use strict';

        function BillingItemVM(params) {
            console.log('Init BillingItemVM');

            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;
            this.initBillingItem();
        }

        BillingItemVM.prototype.initBillingItem = function () {
            var billingItem = this.claimEntry().billingItem() || new BillingItem();
            this.claimEntry().billingItem(billingItem);
            this.billingItem = billingItem;
        }

        BillingItemVM.prototype.removeBillingItem = function (billingItem) {
            this.claimEntry.billingItems.remove(billingItem);
        }

        return {viewModel: BillingItemVM, template: viewHtml};
    });
