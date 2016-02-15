define(['jquery', 'knockout', 'KOMap', 'amplify', 'bootbox', 'underscore',
        'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts', 'app/utils/router',
        'app/utils/session', 'app/utils/sessionKeys',
        'model/bill', 'model/billingItem', 'model/billingStatus', 'model/contact',
        'text!app/components/billing/billing.tmpl.html',
        'text!app/components/billing/billing.print.tmpl.html'
    ],
    function ($, ko, KOMap, amplify, bootbox, _,
              DateUtils, ajaxUtils, Events, Consts, router, Session, SessionKeys, Bill,
              BillingItem, BillingStatus, Contact, viewHtml, printHtml) {

        function BillingVM() {
            console.log('Init BillingVM.');

            this.vmId = new Date().getTime();
            this.Consts = Consts;
            this.DateUtils = DateUtils;
            this.router = router;
            this.billingStatus = KOMap.fromJS(BillingStatus);
            this.mode = ko.observable();
            this.billRecipient = ko.observable(KOMap.fromJS(new Contact()));

            // Updated via Claim lifecycle events
            this.claimId = undefined;
            this.activeClaim = undefined;
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
                var itemClickedJSON = KOMap.toJSON(itemClicked);
                var undoTimer = 4000;

                if (itemClicked.removeOrUndoLabel() === 'Undo') {
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
                            rowNode.fadeTo('slow', .1, function () {
                                self.bill().billingItems.remove(itemClicked);
                                self.calcAll();
                            });
                        }.bind(self),
                        undoTimer);
                }
            };

            // Status tracking
            self.isBillEditable = ko.computed(function () {
                return this.bill().status() == this.billingStatus.NOT_SUBMITTED();
            }, this);
            self.isBillSubmitted = ko.computed(function () {
                return this.bill().status() == this.billingStatus.SUBMITTED();
            }, this);
            self.isBillPaid = ko.computed(function () {
                return this.bill().status() == this.billingStatus.PAID();
            }, this);

            self.haveBillableTasks = ko.computed(function(){
                return this.bill().billingItems().length > 0;
            }, this);

            this.loadBillingProfileFromSession();
        }

        BillingVM.prototype.newEmptyBill = function () {
            var jsObject = new Bill();
            jsObject.billingItems = [];
            jsObject.status = this.billingStatus.NOT_SUBMITTED();
            jsObject.creationDate = new Date();
            jsObject.submissionDate = null;
            jsObject.paidDate = null;
            this.billRecipient(KOMap.fromJS(new Contact()));
            var objWithObservableAttributes = KOMap.fromJS(jsObject);
            return objWithObservableAttributes;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        BillingVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, function (evData) {
                this.claimId = evData.claimId;
                console.log('Billing VM - SHOW_CLAIM ' + this.claimId);
            });
            amplify.subscribe(Events.SAVED_CLAIM, this, function (evData) {
                this.claimId = evData.claim.claimId;
                console.log('Billing VM - SAVED_CLAIM ' + this.claimId);
            });

            amplify.subscribe(Events.CREATE_NEW_BILL, this, this.onCreateNewBill);
            amplify.subscribe(Events.SHOW_BILL, this, this.onShowBill);
            amplify.subscribe(Events.SHOW_BILLING_HISTORY, this, this.onShowBilllingHistory);
            amplify.subscribe(Events.CLOSE_BILLING_VIEW, this, this.onViewClose);
        }

        BillingVM.prototype.setupModeListener = function () {
            var _this = this;

            _this.mode.subscribe(function (mode) {
                if (mode === Consts.BILLING_TAB_CREATE_MODE) {
                    _this.clearBill();
                    _this.getEligibleBillingItemsForClaim(_this.claimId)
                        .done(function(eligibleItems){
                            _this.bill().billingItems(eligibleItems);
                            _this.calcAll();
                        });
                } else if (mode === Consts.BILLING_TAB_HISTORY_MODE) {
                    _this.getBillsForClaim();
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
            if (!this.billingProfile) {
                console.error('Could not retrieve bililng profile from session');
            }
        }

        BillingVM.prototype.onUserProfileClick = function () {
            router.showProfilePopup();
        };

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
            var _this = this;

            if (this.mode() === Consts.BILLING_TAB_VIEW_MODE) {
                console.log('In View mode already');
                return;
            }
            console.log('BillingVM > onShowBilll ' + this.vmId);
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            console.assert(evData.billId, 'Expecting ev to billId');
            this.claimId = evData.claimId;

            this.loadBill(evData.billId)
                .then(_this.calcAll())
                .then(function checkForNewEligibleTasks() {
                    if (_this.bill().status() === BillingStatus.NOT_SUBMITTED) {
                        _this.getEligibleBillingItemsForClaim(evData.claimId)
                            .done(function showDialog(allEligibleItems) {
                                if (allEligibleItems.length > _this.bill().billingItems().length) {
                                    bootbox.dialog({
                                        size: 'small',
                                        backdrop: 'true',
                                        title: "New tasks",
                                        message: "New tasks have been added since the last draft was saved. Add these?",
                                        buttons: {
                                            no: {
                                                label: "No",
                                                className: "btn-danger",
                                                callback: function () {
                                                    // No-op
                                                }
                                            },
                                            yes: {
                                                label: "Yes",
                                                className: "btn-info",
                                                callback: function () {
                                                    _this.bill().billingItems(allEligibleItems);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                    }
                })
                .then(function(){
                    _this.mode(Consts.BILLING_TAB_VIEW_MODE);
                })
        }

        BillingVM.prototype.onShowBilllingHistory = function (evData) {
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            this.claimId = evData.claimId;
            console.log('BillingVM - onShowBilllingHistory - Claim Id ' + this.claimId);
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);
        }

        /***********************************************************/
        /* Unsaved notofication                                    */
        /***********************************************************/

        BillingVM.prototype.onViewClose = function () {
            console.log('BillingVM > onViewClose');
            this.mode() === Consts.BILLING_TAB_CREATE_MODE
                ? this.routeToBillingOverview()
                : router.routeToHome();
        }

        BillingVM.prototype.routeToBillingOverview = function () {
            var self = this;
            if (this.isNewBill() && this.haveBillableTasks()) {
                this.onNavigateAwayFromUnsavedBill();
            } else {
                $('#billPanel').velocity("fadeOut",
                    { duration: 200,
                        complete: function () {
                            router.routeToBillingOverview(self.claimId);
                        }})
            }
        };

        BillingVM.prototype.onNavigateAwayFromUnsavedBill = function () {
            var self = this;
            bootbox.dialog({
                size: 'small',
                backdrop: 'false',
                title: "Unsaved Bill!",
                message: "Save a draft copy of the Invoice? ",
                buttons: {
                    no: {
                        label: "No",
                        className: "btn-danger",
                        callback: function () {
                            router.routeToBillingOverview(self.claimId);
                        }
                    },
                    yes: {
                        label: "Yes",
                        className: "btn-info",
                        callback: function () {
                            self.updateBill();
                        }
                    }
                }
            });
        }

        BillingVM.prototype.isNewBill = function () {
            return this.bill() && !$.isNumeric(this.bill()._id());
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
            var _this = this;
            newValue = newValue || 0;
            console.log('Updating ' + attrName + ' for BillingItem: ' + KOMap.toJSON(billingItemObservable));
            console.log('New value: ' + newValue);

            billingItemObservable[attrName](newValue);
            _this.calcAll();
            var billingItemJS = KOMap.toJSON([billingItemObservable]);
            return ajaxUtils.post(
                '/billingItem',
                billingItemJS,
                function onSuccess(response) {
                    console.log('Saved Billing Items: ' + JSON.stringify(response));
                    billingItemObservable._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Updated billing item'})
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: _this.claimId, claimEntryId: billingItemJS.claimEntryId});
                    _this.getBillsForClaim();
                }
            );
        };

        BillingVM.prototype.getEligibleBillingItemsForClaim = function (claimId) {
            var defer = $.Deferred();
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.prettyPrint(resp.data));
                    var claimEntries = resp.data;
                    var billingItems = [];

                    $.each(claimEntries, function (index, entry) {
                        if (entry.billingItem && entry.billingItem.status !== BillingStatus.NOT_SUBMITTED) {
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
                    defer.resolve(billingItems);
                }.bind(this));
            return defer;
        };

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
            $.each(bill.billingItems(), function (index, item) {
                preTax = preTax + N(item.totalAmount());
            });
            bill.preTaxTotal(N(N(preTax).toFixed(2)));
            bill.taxRate(N(this.billingProfile.taxRate));
            bill.tax(N((bill.taxRate() / 100 * bill.preTaxTotal()).toFixed(2)));
            bill.total(N(N(N(bill.preTaxTotal()) + N(bill.tax())).toFixed(2)));
        };

        BillingVM.prototype.calcBillingItemTotal = function (billingItem) {
            if (billingItem.timeRate() === null || billingItem.distanceRate() === null) {
                console.error('Did not find billing rates in billing item');
                billingItem.totalAmount(0);
                return;
            }
            var N = Number;
            billingItem.totalAmount(Number(
                    N(billingItem.time() * billingItem.timeRate()) +
                    N(billingItem.mileage() * billingItem.distanceRate()) +
                    N(billingItem.expenseAmount())).toFixed(2));
        };

        BillingVM.prototype.clearBill = function () {
            this.bill(this.newEmptyBill());
        };

        BillingVM.prototype.loadBill = function (billId) {
            console.log('Load bill' + billId);
            var defer = $.Deferred();
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({_id: billId}),
                function onSuccess(response) {
                    console.debug('Loaded blll for claim: ' + JSON.stringify(response));
                    if (response.data[0]) {
                        var billJS = response.data[0];
                        billJS.billRecipient = billJS.billRecipient || new Contact();
                        this.bill(KOMap.fromJS(billJS))
                        this.billRecipient(this.bill().billRecipient);
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
            console.log('Get bills for claim ' + this.claimId);
            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({claimId: this.claimId}),
                function onSuccess(response) {
                    console.debug('getBillsForClaim: ' + JSON.stringify(response));
                    this.bills(_.sortBy(response.data, '_id').reverse());
                }.bind(this)
            );
        };

        BillingVM.prototype.cancelBillCreation = function () {
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);
        };

        /***********************************************************/
        /* Save/update                                             */
        /***********************************************************/

        BillingVM.prototype.updateBill = function () {
            return this._persistBill(BillingStatus.NOT_SUBMITTED)
        };

        BillingVM.prototype.submitBill = function () {
            this.bill().submissionDate(new Date());
            this._persistBill(BillingStatus.SUBMITTED);
        }

        BillingVM.prototype._persistBill = function (billingStatus, onDone) {
            console.log('Saving Bill');
            var defer = $.Deferred();
            this.bill().claimId(this.claimId);
            this.bill().billRecipient = this.billRecipient();

            // Timestamp status update
            this.bill().status(billingStatus);
            if (billingStatus == BillingStatus.SUBMITTED) {
                this.bill().submissionDate(new Date());
            }
            if (billingStatus == BillingStatus.PAID) {
                this.bill().paidDate(new Date());
            }

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
                            amplify.publish(Events.SAVED_BILL, {billId: this.bill()._id()})
                            defer.resolve();
                            this.routeToBillingOverview();
                            this.getBillsForClaim();
                        }.bind(this));
                }.bind(this));
            return defer;
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

        BillingVM.prototype.printBill = function () {
            // Poulate the print template with AMD content
            $('#print-template').html(printHtml);
            var container = document.createElement("div");
            var _this = this;
            _this.activeClaim = Session.getActiveClaim();

            ko.renderTemplate(
                "print-template",
                _this,
                {
                    afterRender: function print() {
                        console.log(container.innerHTML);

                        // Add frame
                        var frame = document.createElement('iframe');
                        document.body.appendChild(frame);

                        // Print
                        var frameContent = frame.contentWindow;
                        frameContent.document.open();
                        frameContent.document.write('<head><link rel=stylesheet href=../../css/print.css type=text/css ></head>');
                        frameContent.document.write(container.innerHTML);
                        frameContent.document.close();
                        setTimeout(function afterFrameRender() {
                            frameContent.focus();
                            frameContent.print();
                            document.body.removeChild(frame);
                        }, 500);
                    }
                },
                container
            );
        };

        return {viewModel: BillingVM, template: viewHtml};
    })