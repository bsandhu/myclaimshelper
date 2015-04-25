define(['jquery', 'knockout', 'KOMap', 'amplify', 'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/events',
        'model/bill', 'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, DateUtils, ajaxUtils, Events, Bill, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM. ClaimId: ' + JSON.stringify(claimId));
            this.claimId = claimId;
            //this.claimId = 'claim_id';
            this.DateUtils = DateUtils;
            this.claimEntries = ko.observableArray([]);
            this.createMode = ko.observable(false);

            // Active Bill
            this.bill = ko.observable(new Bill());
            // All bills associated with this Claim
            this.bills = ko.observableArray([]);

            this.setupEvListeners();
            this.getBillsForClaim();
        }

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        BillingVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.CREATE_NEW_BILL, this, this.onCreateNewBill);
        }

        BillingVM.prototype.onCreateNewBill = function (evData) {
            this.claimId = evData.claimId;
            console.assert(this.claimId, 'Expecting ev to carry claimId');
            this.loadEntriesForClaim(this.claimId);
            this.createMode(true);
        }

        BillingVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                    //this.sortEntries();
                }.bind(this));
        };

        BillingVM.prototype.addClaimEntryToBill = function (claimEntry) {
            var billingItem = new BillingItem();
            billingItem.claimEntryId
            this.bill().billingItems.push()
        }

        BillingVM.prototype.loadBill = function (bill) {
            console.log('Load bill: ' + JSON.stringify(bill));
            $.getJSON('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded bill ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId);
                }.bind(this));
        };

        BillingVM.prototype.getBillsForClaim = function () {
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({claimId: this.claimId}),
                function onSuccess(response) {
                    console.log('getBillsForClaim: ' + JSON.stringify(response));
                    this.bills(response.data);
                }.bind(this)
            );
        };

        BillingVM.prototype.createBill = function () {
            console.log('Saving Bill');
            this.bill = KOMap.fromJS(new Bill())
            this.bill.claimId(this.claimId);

            ajaxUtils.post(
                '/bill',
                KOMap.toJSON(this.bill),
                function onSuccess(response) {
                    console.log('Saved Bill: ' + JSON.stringify(response));

                    // Update Ids gen. by the server
                    this.bill._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Bill'});
                }.bind(this));

            function createBillingItems() {
                var claimEntries = this.loadEntriesForClaim(this.claimId);
                var billingItems = [];
                $.each(claimEntries, function (index, entry) {
                    var billingItem = new BillingItem();
                });
            };
        };

        BillingVM.prototype.onClaimEntrySelect = function (claimEntry) {
        };

        return {viewModel: BillingVM, template: viewHtml};
    })