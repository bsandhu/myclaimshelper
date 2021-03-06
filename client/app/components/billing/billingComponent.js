define(['jquery', 'knockout', 'KOMap', 'amplify', 'bootbox', 'underscore',
        'shared/dateUtils', 'shared/NumberUtils', 'shared/objectUtils', 'app/utils/ajaxUtils', 'app/utils/events',
        'app/utils/consts', 'app/utils/router',
        'app/utils/session', 'app/utils/sessionKeys',
        'model/bill', 'model/billingItem', 'model/billingStatus', 'model/contact',
        'text-loader!app/components/billing/billing.tmpl.html',
        'text-loader!app/components/billing/billing.print.tmpl.html',
        'text-loader!app/components/billing/billing.print2.tmpl.html',
        'text-loader!app/components/claim/contact.print.tmpl.html',
        'text-loader!app/components/billing/billing.create.tmpl.html',
        'text-loader!app/components/billing/billing.list.tmpl.html',
        'app/utils/audit', 'app/components/contact/contactUtils'
    ],
    function ($, ko, KOMap, amplify, bootbox, _, DateUtils, NumberUtils, ObjectUtils, ajaxUtils, Events,
              Consts, router, Session, SessionKeys, Bill, BillingItem, BillingStatus, Contact,
              viewHtml, printTmpl, print2Tmpl, contactPrintTmpl, createHtml, listHtml,
              Audit, ContactUtils) {

        function BillingVM() {
            console.log('Init BillingVM.');

            this.vmId = new Date().getTime();
            this.readyToRender = ko.observable(window.location.hash.indexOf('bill') >= 0);
            this.Consts = Consts;
            this.DateUtils = DateUtils;
            this.BillingStatus = BillingStatus;
            this.NumberUtils = NumberUtils;
            this.ObjectUtils = ObjectUtils;
            this.ContactUtils = ContactUtils;
            this.router = router;
            this.billingStatus = KOMap.fromJS(BillingStatus);
            this.userProfile = undefined;
            this.billingProfile = undefined;
            this.mode = ko.observable();
            this.showClosedClaims = ko.observable(false);
            this.groupedByCode = ko.observableArray([]);
            this.createHtml = createHtml;
            this.listHtml = listHtml;
            this.billingTmpls = {'printTmpl': printTmpl, 'print2Tmpl': print2Tmpl};
            this.contactPrintTmpl = contactPrintTmpl;

            // Grouping
            this.groupBy = ko.observable('Not Submitted');
            this.groupByOptions = ko.observableArray(['Any', 'Not Submitted', 'Submitted', 'Paid']);

            // Updated via Claim lifecycle events
            this.claimId = ko.observable();

            // Active Bill - new or unsubmitted
            this.bill = ko.observable(this.newEmptyBill());
            this.removedBillingItems = [];
            // All bills associated with this Claim - for Overview
            this.bills = ko.observableArray([]);
            // Filtered by Status
            this.filteredBills = ko.observableArray([]);

            this.setupEvListeners();
            this.setupModeListener();

            this.mode.extend({notify: 'always'});
            this.mode(Consts.BILLING_TAB_HISTORY_MODE);

            var self = this;
            self.filteredBills = ko.computed(function () {
                return _.filter(self.bills(), function (bill) {
                    var statusMatch = (bill.status === self.groupBy()) || (self.groupBy() === 'Any');
                    return statusMatch;
                })
            });
            self.filteredTotal = ko.computed(function () {
                return _.reduce(self.filteredBills(), function (result, bill) {
                    return Number(result) + Number(bill.total);
                }, 0)
            });
            self.filteredTotalTime = ko.computed(function () {
                return _.reduce(self.filteredBills(), function (result, bill) {
                    return Number(result) + Number(bill.totalTime);
                }, 0)
            });
            self.filteredTotalMileage = ko.computed(function () {
                return _.reduce(self.filteredBills(), function (result, bill) {
                    return Number(result) + Number(bill.totalMileage);
                }, 0)
            });
            self.filteredTotalExpenses = ko.computed(function () {
                return _.reduce(self.filteredBills(), function (result, bill) {
                    return Number(result) + Number(bill.totalExpenseAmount);
                }, 0)
            });

            self.removeBillingItem = function (ev) {
                console.log('Toggle remove BillingItem timer');
                var itemClicked = this;
                var ev = arguments[1];
                var rowNode = $(ev.target).parent().parent();
                var itemClickedJSON = KOMap.toJSON(itemClicked);
                var undoTimer = 3000;

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
                                self.removedBillingItems.push(itemClicked);
                                self.calcAll();
                            });
                        }.bind(self),
                        undoTimer);
                }
            };

            // Status tracking
            self.isClaimClosed = ko.computed(function () {
                return this.bill().isClaimClosed() === true;
            }, this);
            self.isBillEditable = ko.computed(function () {
                return this.bill().status() == this.billingStatus.NOT_SUBMITTED()
                    && !this.isClaimClosed();
            }, this);
            self.isBillSubmitted = ko.computed(function () {
                return this.bill().status() == this.billingStatus.SUBMITTED();
            }, this);
            self.isBillPaid = ko.computed(function () {
                return this.bill().status() == this.billingStatus.PAID();
            }, this);

            self.haveBillableTasks = ko.computed(function () {
                return this.bill().billingItems().length > 0;
            }, this);

            this.loadUserProfileFromSession();
        }

        BillingVM.prototype.newEmptyBill = function () {
            let jsObject = new Bill();
            jsObject.billingItems = [];
            jsObject.status = this.billingStatus.NOT_SUBMITTED();
            jsObject.creationDate = new Date();
            jsObject.submissionDate = null;
            jsObject.paidDate = null;
            jsObject.isClaimClosed = false;

            let objWithObservAttrs = KOMap.fromJS(jsObject);
            return objWithObservAttrs;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        BillingVM.prototype.setupEvListeners = function () {
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
                    _this.getEligibleBillingItemsForClaim(_this.claimId())
                        .done(function (eligibleItems) {
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

        BillingVM.prototype.loadUserProfileFromSession = function (evData) {
            amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                this.userProfile = Session.getCurrentUserProfile();
                if (!this.userProfile) {
                    console.error('Could not retrieve User profile from session');
                }
            });
        }

        BillingVM.prototype.loadBillingProfile = function (claimId) {
            var _this = this;
            var defer = $.Deferred();

            ajaxUtils.getJSON('/billing/profile/' + claimId)
                .then(function (resp) {
                    console.log('Loaded BillingProfile for Claim ' + claimId);
                    _this.billingProfile = resp.data;
                    defer.resolve();
                });
            return defer;
        }

        BillingVM.prototype.onClaimClick = function (bill, ev) {
            ev.stopPropagation();
            router.routeToClaim(bill.claimId);
            return false;
        }

        BillingVM.prototype.onBillingProfileClick = function () {
            if (this.claimId()) {
                router.routeToBillingProfile(this.claimId());
            } else {
                console.error('No claim associated with Bill');
            }
        };

        BillingVM.prototype.onUpdateBillStatus = function (newStatus, bill) {
            console.log('BillingVM > onUpdateBillStatus: ' + newStatus);
            bill.status = newStatus;
            // If the user clicks straight from the billing tab, this might not be populated
            this.claimId(bill.claimId);
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
            this.claimId(evData.claimId);
            this.readyToRender(true);

            // Check if an un-submitted bill exists for claim
            var _this = this;
            _this.loadBillingProfile(evData.claimId)
                .then(function () {
                    _this.getBillsForClaim(
                        function onDone() {
                            var unsubmittedBill = _.find(_this.bills(), function (bill) {
                                return bill.status === BillingStatus.NOT_SUBMITTED;
                            });
                            if (unsubmittedBill) {
                                amplify.publish(Events.INFO_NOTIFICATION, {msg: 'An un-submitted bill is present for this Claim. Opening.'})
                                router.routeToBill.bind({claimId: evData.claimId, _id: unsubmittedBill._id})()
                            } else {
                                _this.mode(Consts.BILLING_TAB_CREATE_MODE);
                            }
                        });
                });
        }

        BillingVM.prototype.onShowBill = function (evData) {
            var _this = this;
            console.log('BillingVM > onShowBilll ' + this.vmId);
            console.assert(evData.claimId, 'Expecting ev to carry claimId');
            console.assert(evData.billId, 'Expecting ev to billId');
            this.claimId(evData.claimId);
            this.readyToRender(true);

            _this.loadBillingProfile(evData.claimId)
                .then(function () {
                    return _this.loadBill(evData.billId);
                })
                .then(function () {
                    _this.calcAll();
                })
                .then(function checkForNewEligibleTasks() {
                    if (!_this.isBillEditable()){
                        return;
                        console.log('Bill in Submitted/Paid. Skip refresh')
                    }
                    _this.getEligibleBillingItemsForClaim(evData.claimId)
                        .done(function (allEligibleItems) {

                            // Refresh all saved items
                            var savedItems = _this.bill().billingItems();
                            var savedItemIds = _.map(savedItems, function (item) {
                                return item._id()
                            });
                            var savedItemsRefreshed = _.filter(allEligibleItems, function (item) {
                                return _.contains(savedItemIds, item._id());
                            });
                            var newItemsSet = [];

                            if (allEligibleItems.length > savedItems.length) {
                                bootbox.dialog({
                                    size: 'small', backdrop: 'true', title: "New tasks",
                                    message: "New tasks have been added since the last draft was saved. Add these?",
                                    buttons: {
                                        no: {
                                            label: "No", className: "btn-danger",
                                            callback: _.partial(refresh, savedItemsRefreshed)
                                        },
                                        yes: {
                                            label: "Yes", className: "btn-info",
                                            callback: _.partial(refresh, allEligibleItems)
                                        }
                                    }
                                });
                            } else {
                                refresh(savedItemsRefreshed);
                            }
                        });

                    function refresh(savedItemsRefreshed) {
                        _this.bill().billingItems(savedItemsRefreshed);
                        _this.calcAll();
                    }
                })
                .then(function () {
                    _this.mode(Consts.BILLING_TAB_VIEW_MODE);
                    Audit.info('ViewBill', {_id: _this.bill()._id()});
                })
        }

        BillingVM.prototype.onShowAllClaims = function () {
            this.claimId(null);
            this.onShowBilllingHistory({});
        };

        BillingVM.prototype.onShowBilllingHistory = function (evData) {
            console.assert('Billing component > SHOW_BILLING_HISTORY');
            this.readyToRender(true);

            if (evData.hasOwnProperty('claimId')) {
                console.log('Show Billing History for claim ' + evData.claimId);
                this.claimId(evData.claimId);
            }
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
                    {
                        duration: 200,
                        complete: function () {
                            router.routeToBillingOverview(self.claimId());
                        }
                    })
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
                            router.routeToBillingOverview(self.claimId());
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
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {
                        claimId: _this.claimId(),
                        claimEntryId: billingItemJS.claimEntryId
                    });
                    _this.getBillsForClaim();
                }
            );
        };

        BillingVM.prototype.getEligibleBillingItemsForClaim = function (claimId) {
            var defer = $.Deferred();

            ajaxUtils.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.prettyPrint(resp.data));
                    var claimEntries = resp.data;
                    // Sort
                    claimEntries = _.sortBy(claimEntries, 'dueDate');
                    var billingItems = [];

                    $.each(claimEntries, function (index, entry) {
                        if (entry.billingItem && entry.billingItem.status !== BillingStatus.NOT_SUBMITTED) {
                            console.log('Item already billed: ' + JSON.stringify(entry.billingItem));
                        } else {
                            // TODO Item not billable?
                            entry.billingItem = entry.billingItem || new BillingItem();
                            entry.billingItem.claimEntryId = entry._id;
                            entry.billingItem.entryDate = entry.dueDate;
                            entry.billingItem.tag = entry.tag;
                            entry.billingItem.summary = entry.summary;

                            // Capture a snapshot of rates - they might change post bill submission
                            this.refreshRatesOnBillingItem(entry.billingItem);
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

        BillingVM.prototype.refreshRatesOnBillingItem = function (billingItem) {
            billingItem.timeRate = Number(this.billingProfile.timeRate);
            billingItem.distanceRate = Number(this.billingProfile.distanceRate);
            billingItem.taxRate = Number(this.billingProfile.taxRate);
            billingItem.timeUnit = this.billingProfile.timeUnit;
            billingItem.distanceUnit = this.billingProfile.distanceUnit;
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

            bill.totalTimeInDollars(N(totalTime) * N(this.billingProfile.timeRate));
            bill.totalMileageInDollars(N(totalMileage) * N(this.billingProfile.distanceRate));
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
            let N = Number;
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
            let defer = $.Deferred();
            let _this = this;

            ajaxUtils.post(
                '/bill/search',
                JSON.stringify({search: {_id: billId}, includeClosedClaims: true}),

                function onSuccess(response) {
                    console.debug('Loaded bill for claim: ' + JSON.stringify(response));
                    if (response.data[0]) {
                        let billJS = response.data[0];

                        // Sort
                        billJS.billingItems = _.sortBy(billJS.billingItems, 'entryDate');

                        _.each(billJS.billingItems, function (billingItem) {
                            billingItem.removeOrUndoLabel = 'Remove';

                            // If the BIll is NOT_SUBMITTED, we need to pick any changes in rates
                            if (billJS.status === BillingStatus.NOT_SUBMITTED) {
                                _this.refreshRatesOnBillingItem(billingItem);
                            }
                        });
                        _this.bill(KOMap.fromJS(billJS))
                        defer.resolve();
                    } else {
                        console.warn('No bill found for Id: ' + billId);
                        defer.reject();
                    }
                });
            return defer;
        };

        BillingVM.prototype.initTooltipComponent = function () {
            $('[data-toggle="tooltip"]').tooltip();
        };

        BillingVM.prototype.getBillsForClaim = function (onDoneCB) {
            console.log('Get bills for claim ' + this.claimId());
            var id = (this.claimId() == null || this.claimId() == 'null' || this.claimId() == 'undefined')
                ? undefined
                : this.claimId();
            var includeClosed = Boolean(id) ? true : false;
            var onDoneCB = onDoneCB || $.noop;

            return ajaxUtils.post(
                '/bill/search',
                JSON.stringify({search: {claimId: id}, includeClosedClaims: includeClosed}),
                function onSuccess(response) {
                    console.log('getBillsForClaim: ' + JSON.stringify(response).substr(0, 100));
                    this.bills(_.sortBy(response.data, '_id').reverse());
                    onDoneCB();
                }.bind(this));
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
            this.bill().claimId(this.claimId());

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
                            this.removedBillingItems = [];
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
            var removedItems = $.map(this.removedBillingItems,
                function unLink(entry) {
                    var billingItem = entry;
                    billingItem.billId(null);
                    billingItem.status(BillingStatus.NOT_SUBMITTED);
                    delete billingItem.removeOrUndoLabel;
                    delete billingItem.timeoutId;
                    return billingItem;
                }.bind(this));

            var activeItems = $.map(this.bill().billingItems(),
                function (entry) {
                    var billingItem = entry;
                    billingItem.billId(this.bill()._id());
                    billingItem.status(status);
                    delete billingItem.removeOrUndoLabel;
                    delete billingItem.timeoutId;
                    return billingItem;
                }.bind(this));

            var allItems = _.union(removedItems, activeItems);
            console.log('Saving BillingItems: ' + KOMap.toJSON(allItems));

            return ajaxUtils.post(
                '/billingItem',
                KOMap.toJSON(allItems),
                function onSuccess(response) {
                    console.log('Saved Billing Items: ' + JSON.stringify(response));
                    onDone();
                }
            );
        };

        BillingVM.prototype.printBill = function () {
            // Populate the print template with AMD content
            $('#print-template').html(this.billingTmpls[Session.getCurrentUserProfile().billingProfile.printTmpl]);
            var container = document.createElement("div");
            var _this = this;
            _this.activeClaim = Session.getActiveClaim();
            _this.groupedByCode([]);

            // Load associated Claim
            // If the app loads straight to the Billing tab an active claim might not be present in Session
            var claimLoaded = $.Deferred();

            if (Session.getActiveClaimId() != _this.claimId()) {
                ajaxUtils.getJSON('/claim/' + _this.claimId())
                    .done(function (resp) {
                        console.log('Loaded claim ' + JSON.stringify(resp.data).substr(0, 100));
                        _this.activeClaim = resp.data;
                        claimLoaded.resolve();
                    });
            } else {
                _this.activeClaim = Session.getActiveClaim();
                claimLoaded.resolve();
            }

            claimLoaded.then(function(){
                // Split out line item for each type
                _.each(KOMap.toJS(_this.bill().billingItems()), function (item, index) {
                    if (item.mileage != 0) {
                        mileageItem = _.clone(item);
                        mileageItem.code = item.mileageCode;
                        mileageItem.time = null;
                        mileageItem.mileage = Number(mileageItem.mileage);
                        mileageItem.expenseAmount = null;
                        _this.groupedByCode.push(mileageItem);
                    }
                    if (item.expenseAmount != 0) {
                        expenseItem = _.clone(item);
                        expenseItem.code = item.expenseCode;
                        expenseItem.time = null;
                        expenseItem.mileage = null;
                        expenseItem.expenseAmount = Number(expenseItem.expenseAmount);
                        _this.groupedByCode.push(expenseItem);
                    }
                    if (item.time != 0) {
                        timeItem = _.clone(item);
                        timeItem.code = item.timeCode;
                        timeItem.time = Number(timeItem.time);
                        timeItem.mileage = null;
                        timeItem.expenseAmount = null;
                        _this.groupedByCode.push(timeItem);
                    }
                });

                // Render the print
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
                Audit.info('PrintBill', {_id: _this.bill()._id()});
            });
        };

        return {viewModel: BillingVM, template: viewHtml};
    })