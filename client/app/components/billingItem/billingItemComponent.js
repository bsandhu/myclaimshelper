define(['knockout', 'KOMap',
        'app/utils/session',
        'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

    function (ko, KOMap, Session, viewHtml, BillingItem) {
        'use strict';

        function BillingItemVM(params) {
            console.log('Init BillingItemVM');

            console.assert(params.billingItem, 'Expecting billingItem param');
            this.billingItem = params.billingItem;
            this.billingItem().mileageCode.subscribe(function(newVal){
                this.billingItem().timeCode(newVal);
            }, this);
            this.userProfile = Session.getCurrentUserProfile();
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
