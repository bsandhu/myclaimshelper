define(['jquery', 'knockout', 'KOMap', 'amplify',
        'model/Bill', 'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, Bill, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM');
            this.claimId = claimId;
            this.bill = ko.observable(new Bill());
            this.claimEntries = ko.observableArray();

        }

        BillingVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                    this.sortEntries();
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
    })