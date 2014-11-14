define(['knockout', 'KOMap', 'text!app/components/billingItem/billingItemComponent.tmpl.html', 'model/billingItem'],

  function (ko, KOMap, viewHtml, BillingItem) {
    'use strict';

    function BillingItemVM(params) {
      var self = this;
      console.log('BillingItemVM() called' + params.claimEntry);
      console.assert(params.claimEntry, 'Expecting claimEntry param');
      self.claimEntry = params.claimEntry;

      self.addBillingItem = function (){
        if (self.claimEntry().billingItems == null)
          self.claimEntry().billingItems = [];
        //var billingItem = KOMap.fromJS(new BillingItem());
        var billingItem = new BillingItem();
        self.claimEntry().billingItems.push(billingItem);
        console.log('Added billingItem ' + JSON.stringify(billingItem));
      }

    }
    

    return {viewModel: BillingItemVM, template: viewHtml};
  });
