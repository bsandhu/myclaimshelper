define(['jquery', 'knockout', 'KOMap', 'amplify',
        'model/claim', 'model/claimEntry', 'model/contact', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'shared/dateUtils', 'text!app/components/claim/claim.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Contact, States,
              ajaxUtils, Events, Router, SessionKeys, DateUtils, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM');
            this.claimId = claimId;
        }

        BillingVM.prototype.loadBill(){
            if (_.this.claimId)
            this.
        }
    })