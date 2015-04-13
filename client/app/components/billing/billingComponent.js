define(['jquery', 'knockout', 'KOMap', 'amplify', 'shared/dateUtils',
        'model/Bill', 'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, DateUtils, Bill, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM. ClaimId: ' + JSON.stringify(claimId));
            this.claimId = claimId;
            this.DateUtils = DateUtils;
            this.bill = ko.observable(new Bill());
            this.claimEntries = ko.observableArray();
            this.loadEntriesForClaim(this.claimId);
        }

        BillingVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                    //this.sortEntries();
                }.bind(this));
        };

        BillingVM.prototype.loadBill = function (claimId) {
            $.getJSON('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded bill ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId);
                }.bind(this));
        };

        BillingVM.prototype.createBill = function () {
            this.loadEntriesForClaim(this.claimId);
        };

        BillingVM.prototype.onClaimEntrySelect = function (claimEntry) {
        };

        return {viewModel: BillingVM, template: viewHtml};
    })