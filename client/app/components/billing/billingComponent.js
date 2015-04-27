define(['jquery', 'knockout', 'KOMap', 'amplify', 'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts',
        'model/bill', 'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, DateUtils, ajaxUtils, Events, Consts, Bill, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM. ClaimId: ' + JSON.stringify(claimId));

            this.Consts = Consts;
            this.claimId = claimId;
            this.DateUtils = DateUtils;
            this.mode = ko.observable();

            this.claimEntries = ko.observableArray([]);
            // Active Bill
            this.bill = ko.observable(this.newEmptyBill());
            // All bills associated with this Claim
            this.bills = ko.observableArray([]);

            this.setupEvListeners();
            this.setupModeListener();

            this.mode.extend({ notify: 'always' });
            this.mode(Consts.BILLING_TAB_LIST_MODE);
        }

        BillingVM.prototype.newEmptyBill = function () {
            var jsObject = new Bill();
            var objWithObservableAttributes = KOMap.fromJS(jsObject);
            return objWithObservableAttributes;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        BillingVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.CREATE_NEW_BILL, this, this.onCreateNewBill);
        }

        BillingVM.prototype.setupModeListener = function () {
            this.mode.subscribe(function (mode) {
                if (mode === Consts.BILLING_TAB_CREATE_MODE) {
                    this.loadEntriesForClaim(this.claimId);
                } else if (mode === Consts.BILLING_TAB_LIST_MODE) {
                    this.getBillsForClaim();
                }
            }, this);
        }

        BillingVM.prototype.onCreateNewBill = function (evData) {
            this.claimId = evData.claimId;
            console.assert(this.claimId, 'Expecting ev to carry claimId');
            this.mode(Consts.BILLING_TAB_CREATE_MODE);

        }

        BillingVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                    //this.sortEntries();
                }.bind(this));
        };

        BillingVM.prototype.loadBill = function (bill) {
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({_Id: bill._id}),
                function onSuccess(response) {
                    console.log('getBillsForClaim: ' + JSON.stringify(response));
                    this.bill(KOmap.fromJS(response));
                }.bind(this)
            );
        };

        BillingVM.prototype.removeBillingItem = function(){

        };

        BillingVM.prototype.initTooltipComponent = function(){
            $('[data-toggle="tooltip"]').tooltip()
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

        BillingVM.prototype.cancelBillCreation = function () {
            this.mode(Consts.BILLING_TAB_LIST_MODE);
        };

        BillingVM.prototype.saveBill = function () {
            console.log('Saving Bill');
            this.bill().claimId(this.claimId);

            ajaxUtils.post(
                '/bill',
                KOMap.toJSON(this.bill),
                function onSuccess(response) {
                    console.log('Saved Bill: ' + JSON.stringify(response));

                    // Update Ids gen. by the server
                    this.bill()._id(response.data._id);
                    this.saveBillingItems();
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Bill'});
                }.bind(this));
        };

        /**
         * Associate the BillingItems to Bill
         */
        BillingVM.prototype.saveBillingItems = function () {
            var billingItems = $.map(this.claimEntries(),
                function (entry) {
                    var billingItem = entry.billingItem;
                    if (billingItem && !$.isEmptyObject(billingItem)) {
                        billingItem.billId = this.bill()._id();
                        return billingItem;
                    } else {
                        return undefined;
                    }
                }.bind(this));
            console.log('Saving BillingItems: ' + JSON.stringify(billingItems));
            ajaxUtils.post(
                '/billingItem',
                KOMap.toJSON(billingItems),
                function onSuccess(response) {
                    console.log('Saved Billing Items: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Billing Items'});
                }.bind(this));
        };

        return {viewModel: BillingVM, template: viewHtml};
    })