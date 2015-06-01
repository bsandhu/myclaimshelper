define(['jquery', 'knockout', 'KOMap', 'amplify', 'shared/dateUtils',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts', 'app/utils/router', 'app/utils/session',
        'model/bill', 'model/billingItem', 'model/billingStatus', 'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, DateUtils, ajaxUtils, Events, Consts, router, Session, Bill, BillingItem, BillingStatus, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM. ClaimId: ' + JSON.stringify(claimId));

            this.Consts = Consts;
            this.claimId = claimId;
            this.DateUtils = DateUtils;
            this.mode = ko.observable();

            // Active Bill
            this.bill = ko.observable(this.newEmptyBill());
            // All bills associated with this Claim - for Overview
            this.bills = ko.observableArray([]);

            this.setupEvListeners();
            this.setupModeListener();

            this.mode.extend({ notify: 'always' });
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);

            var self = this;
            self.removeBillingItem = function (ev) {
                console.log('Toggle remove BillingItem timer');
                var itemClicked = this;
                var ev = arguments[1];
                var rowNode = $(ev.target).parent().parent();
                var itemClickedJSON =  KOMap.toJSON(itemClicked);
                var undoTimer = 8000;

                if (itemClicked.removeOrUndoLabel() === 'Undo'){
                    console.log('Cancelled remove BillingItem: ' + itemClickedJSON);
                    clearTimeout(itemClicked.timeoutId);
                    itemClicked.timeoutId = undefined;
                    itemClicked.removeOrUndoLabel('Remove');
                    rowNode.fadeTo('slow', 1);
                } else {
                    rowNode.fadeTo('slow', .5);
                    itemClicked.removeOrUndoLabel('Undo');
                    itemClicked.timeoutId = setTimeout(
                        function () {
                            console.log('Remove BillingItem: ' + itemClickedJSON);
                            rowNode.fadeTo('slow', .1, function(){
                                self.bill().billingItems.remove(itemClicked);
                                self.calcTax();
                            });
                        }.bind(self),
                        undoTimer);
                }
            };
        }

        BillingVM.prototype.newEmptyBill = function () {
            var jsObject = new Bill();
            jsObject.billingItems = [];
            var objWithObservableAttributes = KOMap.fromJS(jsObject);
            return objWithObservableAttributes;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        BillingVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.CREATE_NEW_BILL, this, this.onCreateNewBill);
            amplify.subscribe(Events.SHOW_BILL, this, this.onShowBill);
            amplify.subscribe(Events.SHOW_BILLING_HISTORY, this, this.onShowBilllingHistory);
        }

        BillingVM.prototype.setupModeListener = function () {
            this.mode.subscribe(function (mode) {
                if (mode === Consts.BILLING_TAB_CREATE_MODE) {
                    this.clearBill();
                    this.loadBillingProfileFromSession();
                    this.loadEligibleBillingItemsForClaim(this.claimId).done(this.calcTax.bind(this));
                } else if (mode === Consts.BILLING_TAB_HISTORY_MODE) {
                    this.getBillsForClaim();
                } else if (mode === Consts.BILLING_TAB_VIEW_MODE) {
                    console.log('View Bill');
                }
            }, this);
        }

        BillingVM.prototype.loadBillingProfileFromSession = function (evData) {
            this.billingProfile = Session.getCurrentUserProfile().billingProfile;
            if(!this.billingProfile){
                console.error('Could not retrieve bililng profile from session');
            }
        };

        BillingVM.prototype.onCreateNewBill = function (evData) {
            console.log('BillingVM > onCreateNewBill');
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            this.claimId = evData.claimId;
            this.mode(Consts.BILLING_TAB_CREATE_MODE);
        }

        BillingVM.prototype.onShowBill = function (evData) {
            console.log('BillingVM > onShowBilll');
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            console.assert(evData.billId, 'Expecting ev to billId');
            this.claimId = evData.claimId;
            this.loadBill(evData.billId);
            this.mode(Consts.BILLING_TAB_VIEW_MODE);
        }

        BillingVM.prototype.onShowBilllingHistory = function (evData) {
            console.log('BillingVM > onShowBilllingHistory');
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            this.claimId = evData.claimId;
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);
        }

        BillingVM.prototype.onTimeUpdate = function (billingItemObservable, resp, newValue) {
            this._onBillingItemAttrUpdate(billingItemObservable, 'time', newValue);
        }

        BillingVM.prototype.onMileageUpdate = function (billingItemObservable, resp, newValue) {
            this._onBillingItemAttrUpdate(billingItemObservable, 'mileage', newValue);
        }

        BillingVM.prototype.onExpenseAmountUpdate = function (billingItemObservable, resp, newValue) {
            this._onBillingItemAttrUpdate(billingItemObservable, 'expenseAmount', newValue);
        }

        BillingVM.prototype._onBillingItemAttrUpdate = function (billingItemObservable, attrName, newValue) {
            newValue = newValue || 0;
            console.log('Updating ' + attrName + ' for BillingItem: ' + KOMap.toJSON(billingItemObservable));
            console.log('New value: ' + newValue);

            billingItemObservable[attrName](newValue);
            this.calcBillingItemTotal(billingItemObservable);
            this.calcTax();
            return ajaxUtils.post(
                '/billingItem',
                KOMap.toJSON([billingItemObservable]),
                function onSuccess(response) {
                    console.log('Saved Billing Items: ' + JSON.stringify(response));
                    billingItemObservable._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Updated billing item'})
                }
            );
        };

        BillingVM.prototype.loadEligibleBillingItemsForClaim = function (claimId) {
            var defer = $.Deferred();
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.prettyPrint(resp.data));
                    var claimEntries = resp.data;
                    var billingItems = [];

                    $.each(claimEntries, function (index, entry) {
                        if (entry.billingItem && entry.billingItem.status === BillingStatus.BILLED) {
                            console.log('Item already billed: ' + JSON.stringify(entry.billingItem));
                        } else {
                            // TODO Item not billable?
                            entry.billingItem = entry.billingItem || new BillingItem();
                            entry.billingItem.claimEntryId = entry._id;
                            entry.billingItem.entryDate = entry.entryDate;
                            entry.billingItem.tag = entry.tag;
                            entry.billingItem.summary = entry.summary;
                            entry.billingItem.timeRate = this.billingProfile.timeRate;
                            entry.billingItem.distanceRate = this.billingProfile.distanceRate;
                            entry.billingItem.removeOrUndoLabel = 'Remove';

                            var observableItem = KOMap.fromJS(entry.billingItem);
                            this.calcBillingItemTotal(observableItem);
                            billingItems.push(observableItem);
                            console.log('Eligible BillingItem: ' + JSON.stringify(entry.billingItem));
                        }
                    }.bind(this));
                    this.bill().billingItems(billingItems);
                    defer.resolve();
                }.bind(this));
            return defer;
        };

        /***********************************************************/
        /* Calculations                                            */
        /***********************************************************/

        BillingVM.prototype.calcTax = function () {
            var bill = this.bill();
            var N = Number;

            var preTax = 0;
            $.each(bill.billingItems(), function(index, item){
                preTax = preTax +  N(item.totalAmount());
            });
            bill.preTaxTotal(N(preTax).toFixed(2));
            bill.taxRate(N(this.billingProfile.taxRate));
            bill.tax(N((bill.taxRate()/100 * bill.preTaxTotal()).toFixed(2)));
            bill.total(N(N(bill.preTaxTotal()) + N(bill.tax())).toFixed(2));
        };

        BillingVM.prototype.calcBillingItemTotal = function (billingItem) {
            if (billingItem.timeRate() === null || billingItem.distanceRate() === null) {
                console.error('Did not find billing rates in billing item');
                billingItem.totalAmount(0);
                return;
            }
            billingItem.totalAmount(Number(
                (billingItem.time() * billingItem.timeRate()) +
                (billingItem.mileage() * billingItem.distanceRate()) +
                (billingItem.expenseAmount())).toFixed(2));
        };

        BillingVM.prototype.clearBill = function () {
            this.bill = ko.observable(this.newEmptyBill());
        };

        BillingVM.prototype.loadBill = function (billId) {
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({_id: billId}),
                function onSuccess(response) {
                    console.log('getBillsForClaim: ' + JSON.stringify(response));
                    if (response.data[0]){
                        this.bill(KOMap.fromJS(response.data[0]))
                    } else {
                        console.warn('No bill found for Id: ' + billId);
                    }
                }.bind(this)
            );
        };

        BillingVM.prototype.routeToBillingOverview = function () {
            router.routeToBillingOverview(this.claimId);
        };

        BillingVM.prototype.initTooltipComponent = function () {
            $('[data-toggle="tooltip"]').tooltip();
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
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);
        };

        BillingVM.prototype.updateBill = function () {
            this._persistBill(BillingStatus.NOT_BILLED);
        };

        BillingVM.prototype.submitBill = function () {
            this._persistBill(BillingStatus.BILLED);
        }

        BillingVM.prototype._persistBill = function (billingStatus) {
            console.log('Saving Bill');
            this.bill().claimId(this.claimId);
            this.bill().billingDate(new Date());
            this.bill().status(billingStatus);

            ajaxUtils.post(
                '/bill',
                KOMap.toJSON(this.bill),
                function onSuccess(response) {
                    console.log('Saved Bill: ' + JSON.stringify(response));

                    // Update Ids gen. by the server
                    this.bill()._id(response.data._id);
                    this.submitBillingItems(
                        billingStatus,
                        function () {
                            amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Bill'})
                            // TODO reload
                        });
                }.bind(this));
        };

        /*
         * Associate the BillingItems to Bill
         */
        BillingVM.prototype.submitBillingItems = function (status, onDone) {
            var billingItems = $.map(this.bill().billingItems(),
                function (entry) {
                    var billingItem = entry;
                    billingItem.billId(this.bill()._id());
                    billingItem.status(status);
                    delete billingItem.removeOrUndoLabel;
                    delete billingItem.timeoutId;
                    return billingItem;
                }.bind(this));
            console.log('Saving BillingItems: ' + KOMap.toJSON(billingItems));
            return ajaxUtils.post(
                '/billingItem',
                KOMap.toJSON(billingItems),
                function onSuccess(response) {
                    console.log('Saved Billing Items: ' + JSON.stringify(response));
                    onDone();
                }
            );
        };

        return {viewModel: BillingVM, template: viewHtml};
    })