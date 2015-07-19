define(['jquery', 'knockout', 'KOMap', 'amplify', 'shared/dateUtils',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts', 'app/utils/router', 'app/utils/session',
        'model/bill', 'model/billingItem', 'model/billingStatus', 'model/contact',
        'text!app/components/billing/billing.tmpl.html'],
    function ($, ko, KOMap, amplify, DateUtils, ajaxUtils, Events, Consts, router, Session, Bill, BillingItem, BillingStatus, Contact, viewHtml) {

        function BillingVM(claimId) {
            console.log('Init BillingVM. ClaimId: ' + JSON.stringify(claimId));

            this.Consts = Consts;
            this.claimId = claimId;
            this.DateUtils = DateUtils;
            this.billingStatus = KOMap.fromJS(BillingStatus);
            this.mode = ko.observable();
            this.billRecipient = ko.observable(KOMap.fromJS(new Contact()));

            // Active Bill - new or unsubmitted
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
                var undoTimer = 4000;

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
                                self.calcAll();
                            });
                        }.bind(self),
                        undoTimer);
                }
            };

            self.isBillEditable = ko.computed(function(){
                return this.bill().status() == this.billingStatus.NOT_SUBMITTED();
            }, this);

            this.loadBillingProfileFromSession();
        }

        BillingVM.prototype.newEmptyBill = function () {
            var jsObject = new Bill();
            jsObject.billingItems = [];
            jsObject.status = this.billingStatus.NOT_SUBMITTED();
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
                    this.loadEligibleBillingItemsForClaim(this.claimId).done(this.calcAll.bind(this));
                } else if (mode === Consts.BILLING_TAB_HISTORY_MODE) {
                    this.getBillsForClaim();
                } else if (mode === Consts.BILLING_TAB_VIEW_MODE) {
                    console.log('View Bill');
                }
            }, this);
        }

        BillingVM.prototype.afterBillingCreateRender = function (evData, vm) {
            vm.initTooltipComponent();
            $('#bililngCreateMsg').fadeOut(8000);
        }

        BillingVM.prototype.loadBillingProfileFromSession = function (evData) {
            this.billingProfile = Session.getCurrentUserProfile().billingProfile;
            if(!this.billingProfile){
                console.error('Could not retrieve bililng profile from session');
            }
        }

        BillingVM.prototype.onUpdateBillStatus = function (newStatus, bill) {
            console.log('BillingVM > onUpdateBillStatus: ' + newStatus);
            bill.status = newStatus;
            this.bill(this.newEmptyBill());
            this.bill(KOMap.fromJS(bill));
            this._persistBill(newStatus);
            var bills = this.bills();
            this.bills([]);
            this.bills(bills);
        }

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
            this.loadBill(evData.billId).done(this.calcAll.bind(this));;
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
            this.calcAll();
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
                        if (entry.billingItem && entry.billingItem.status === BillingStatus.SUBMITTED) {
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
                            billingItems.push(observableItem);
                            console.log('Eligible BillingItem: ' + JSON.stringify(entry.billingItem));
                        }
                    }.bind(this));
                    this.bill().billingItems(billingItems);
                    defer.resolve();
                }.bind(this));
            return defer;
        };

        BillingVM.prototype.routeToBillingOverview = function () {
            if (this.isNewBill()) {
                this.onNavigateAwayFromUnsavedBill();
            } else {
                router.routeToBillingOverview(this.claimId);
            }
        };

        /***********************************************************/
        /* Unsaved notofication                                    */
        /***********************************************************/

        BillingVM.prototype.isNewBill = function(){
            return this.bill() && !$.isNumeric(this.bill()._id());
        }

        BillingVM.prototype.onNavigateAwayFromUnsavedBill = function () {
            var self = this;
            $.SmartMessageBox({
                title: "Unsaved Bill!",
                content: "Save a draft copy of the Invoice? ",
                buttons: '[No][Yes]'
            }, function (ButtonPressed) {
                if (ButtonPressed === "Yes") {
                    self.updateBill(function onDone(){
                        router.routeToBillingOverview(self.claimId);
                    });
                } else {
                    router.routeToBillingOverview(self.claimId);
                }
            });
        }

        /***********************************************************/
        /* Calculations                                            */
        /***********************************************************/

        BillingVM.prototype.calcAll = function () {
            if (this.isBillEditable()) {
                console.info('Bill not submitted. Re-calc');
                this.calcBillingItemTotals();
                this.calcSubTotals();
                this.calcTax();
            } else {
                console.info('Bill submitted/paid. Skipping re-calc');
            }
        };

        BillingVM.prototype.calcBillingItemTotals = function () {
            $.each(this.bill().billingItems(), function (index, item) {
                this.calcBillingItemTotal(item);
            }.bind(this));
        };

        BillingVM.prototype.calcSubTotals = function () {
            var bill = this.bill();
            var N = Number;

            var totalTime = 0;
            var totalMileage = 0;
            var totalExpense = 0;
            $.each(bill.billingItems(), function (index, item) {
                totalTime = totalTime + N(item.time());
                totalMileage = totalMileage + N(item.mileage());
                totalExpense = totalExpense + N(item.expenseAmount());
            });
            bill.totalTime(totalTime);
            bill.totalMileage(totalMileage);
            bill.totalExpenseAmount(totalExpense);
        };

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
            this.bill(this.newEmptyBill());
        };

        BillingVM.prototype.loadBill = function (billId) {
            var defer = $.Deferred();
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({_id: billId}),
                function onSuccess(response) {
                    console.log('getBillsForClaim: ' + JSON.stringify(response));
                    if (response.data[0]){
                        this.bill(KOMap.fromJS(response.data[0]))
                        defer.resolve();
                    } else {
                        console.warn('No bill found for Id: ' + billId);
                        defer.reject();
                    }
                }.bind(this)
            );
            return defer;
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

        /***********************************************************/
        /* Save/update                                             */
        /***********************************************************/

        BillingVM.prototype.updateBill = function (onDone) {
            this.bill().billingDate(null);
            this._persistBill(BillingStatus.NOT_SUBMITTED, onDone);
        };

        BillingVM.prototype.submitBill = function () {
            this.bill().billingDate(new Date());
            this._persistBill(BillingStatus.SUBMITTED);
        }

        BillingVM.prototype._persistBill = function (billingStatus, onDone) {
            console.log('Saving Bill');
            onDone = onDone || $.noop;
            this.bill().claimId(this.claimId);
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
                            onDone();
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