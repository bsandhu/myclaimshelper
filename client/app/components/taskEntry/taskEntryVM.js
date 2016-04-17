define(['underscore', 'jquery', 'knockout', 'KOMap', 'amplify',
        'model/claim', 'model/claimEntry', 'model/billingItem', 'model/billingStatus', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router',
        'app/utils/sessionKeys', 'app/utils/session',
        'shared/dateUtils', 'app/utils/audit',
        'text!app/components/taskEntry/taskEntry.tmpl.html', 'bootbox'],
    function (_, $, ko, KOMap, amplify, Claim, ClaimEntry, BillingItem, BillingStatus, States, ajaxUtils, Events,
              Router, SessionKeys, Session, DateUtils, Audit, taskEntryView, bootbox) {
        'use strict';

        function TaskEntryVM() {
            console.log('Init TaskEntryVM');
            this.DateUtils = DateUtils;

            // Used to pass date back n forth the Due date picker binding.
            // Does not seem to work properly with nested observable (claimEntry().dueDate)
            this.myDueDate = ko.observable();
            this.myDescription = ko.observable();

            // Model
            this.claimEntry = ko.observable(this.newEmptyClaimEntry());

            // View state
            this.inEditMode = ko.observable(true);
            this.stateChange = ko.observable(false);
            this.isClosed = ko.computed(function () {
                return this.claimEntry().isClosed();
            }, this);
            this.isSaved = ko.computed(function () {
                return Number(this.claimEntry()._id()) > 0;
            }, this);
            this.isBilled = ko.computed(function () {
                return this.claimEntry().billingItem().status() != BillingStatus.NOT_SUBMITTED;
            }, this);
            this.isNotBilled = ko.computed(function () {
                return !this.isBilled();
            }, this);

            this.setupEvListeners();
            this.startStateTracking();
        }

        TaskEntryVM.prototype.newEmptyClaimEntry = function (tag) {
            var jsEntryObject = new ClaimEntry();

            var entryObjWithObserAttrs = KOMap.fromJS(jsEntryObject);
            if (entryObjWithObserAttrs.billingItem && ko.isObservable(entryObjWithObserAttrs.billingItem)) {
                entryObjWithObserAttrs.billingItem(KOMap.fromJS(new BillingItem()));
            } else {
                entryObjWithObserAttrs.billingItem = ko.observable(KOMap.fromJS(new BillingItem()));
            }
            entryObjWithObserAttrs.tag([tag || 'other']);
            entryObjWithObserAttrs.dueDate(DateUtils.startOfToday());
            entryObjWithObserAttrs.entryDate(new Date());
            entryObjWithObserAttrs.updateDate(new Date());
            entryObjWithObserAttrs.state(States.TODO);

            this.myDueDate(entryObjWithObserAttrs.dueDate());
            this.myDescription(entryObjWithObserAttrs.description());
            return entryObjWithObserAttrs;
        };

        /**
         * Tracks changes to the Claim entry object. Used to highlight 'save' button on the UI
         */
        TaskEntryVM.prototype.startStateTracking = function () {
            this.claimEntryState = ko.computed(function () {
                return KOMap.toJSON(this.claimEntry) + KOMap.toJSON(this.myDueDate) + KOMap.toJSON(this.myDescription);
            }, this);
            this.claimEntryState.extend({ rateLimit: { timeout: 100, method: "notifyWhenChangesStop" } });

            this.stateChangeSubsciption = this.claimEntryState.subscribe(function (val) {
                this.stateChange(true);
                console.log('ClaimEntry state change');
            }, this);
        };

        TaskEntryVM.prototype.stopStateTracking = function () {
            this.stateChangeSubsciption.dispose();
            this.stateChange(false);
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        TaskEntryVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.onNewClaimEntry);
            amplify.subscribe(Events.UPDATE_CLAIM_ENTRY_STATUS, this, this.onStatusUpdate);
        };

        TaskEntryVM.prototype.onShowClaimEntry = function (evData) {
            console.log('TaskEntryVM - SHOW_CLAIM_ENTRY ev ' + JSON.stringify(evData));
            this.claimEntry(this.newEmptyClaimEntry());
            this.loadClaimEntry(evData.claimEntryId);
        };

        TaskEntryVM.prototype.onNewClaimEntry = function (evData) {
            console.log('TaskEntryVM - NEW_CLAIM_ENTRY ev ' + JSON.stringify(evData));
            var tag = Boolean(evData.entryType) ? evData.entryType : 'other';
            this.claimEntry(this.newEmptyClaimEntry(tag));

            // Re-size editor
            var txtArea = $("#claimEntry-desc");
            txtArea.height(100);
            console.log('Adding new claim entry. Tag:' + tag);
        };

        /**
         * @param evData {'claimEntryId': entry._id, 'status': status});
         */
        TaskEntryVM.prototype.onStatusUpdate = function (evData) {
            console.log('TaskEntryVM - UPDATE_CLAIM_ENTRY_STATUS ev ' + JSON.stringify(evData));

            var claimEntryId = evData.claimEntryId;
            var claimId = Session.getActiveClaimId();

            this.stopStateTracking();

            ajaxUtils.post(
                '/claimEntry/modify',
                JSON.stringify({_id: claimEntryId, attrsAsJson: {state: evData.status}}),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved entry'});
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: claimId, claimEntryId: claimEntryId});

                    this.startStateTracking();
                }.bind(this));
        };

        TaskEntryVM.prototype.niceHeader = function () {
            return (this.claimEntry()._id === undefined)
                ? 'New Entry'
                : this.claimEntry().summary() || '';
        };

        /***********************************************************/
        /* Server calls                                            */
        /***********************************************************/

        TaskEntryVM.prototype.onDelete = function () {
            var _this = this;
            var activeClaimId = Session.getActiveClaimId();
            var claimEntryId = _this.claimEntry()._id();
            var claimEntrySummary = _this.claimEntry().summary();

            ajaxUtils.post(
                '/claimEntry/delete',
                KOMap.toJSON({claimEntryId: claimEntryId}),
                function onSuccess(response) {
                    if (response.status == 'Success') {
                        console.log('Deleted ClaimEntry: ' + JSON.stringify(response));
                        amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Deleted <strong>' + claimEntrySummary + '</strong> and related billing'});
                        amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: activeClaimId, claimEntryId: claimEntryId});

                        _this.startStateTracking();
                        Router.routeToClaim(Session.getActiveClaimId());
                    } else {
                        amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Could not delete task'});
                    }
                });
        }

        TaskEntryVM.prototype.onSave = function () {
            var defer = $.Deferred();
            this.stopStateTracking();
            /**
             * Since only once Claim can be active, its assumed to be the parent
             */
            var activeClaimId = Session.getActiveClaimId();
            this.claimEntry().claimId(activeClaimId);
            this.claimEntry().updateDate(new Date());
            this.claimEntry().dueDate(this.myDueDate());
            this.claimEntry().description(this.myDescription());
            // TODO binding not updating. Not sure why.
            this.claimEntry().description($('#claimEntry-desc').cleanHtml());
            console.log('Saving ClaimEntry: ' + KOMap.toJSON(this.claimEntry));

            ajaxUtils.post(
                '/claimEntry',
                KOMap.toJSON(this.claimEntry),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    this.claimEntry()._id(response.data._id)
                    // Update description with Entity enriched version
                    this.myDescription(response.data.description);
                    this.claimEntry().description(response.data.description);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved entry'});
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: activeClaimId, claimEntryId: response.data._id});

                    this.startStateTracking();
                    Router.routeToClaim(Session.getActiveClaimId());
                    Audit.info('SavedTask', {_id: this.claimEntry()._id(), summary: this.claimEntry().claimId()});
                    defer.resolve();
                }.bind(this));
            return defer;
        };

        TaskEntryVM.prototype.loadClaimEntry = function (claimEntryId) {
            this.stopStateTracking();
            $("#claimEntry-desc").height(100);

            $.getJSON('/claimEntry/' + claimEntryId)
                .done(function (resp) {
                    console.log('Loaded claim entry ' + JSON.stringify(resp.data).substr(0, 100));

                    // Populate with JSON data
                    KOMap.fromJS(resp.data[0], {}, this.claimEntry);
                    this.myDueDate(this.claimEntry().dueDate());
                    this.myDescription(this.claimEntry().description());

                    // Put in session
                    this.storeInSession(this.claimEntry()._id());
                    this.startStateTracking();

                    window.setTimeout(function reSizeEditor() {
                        var txtArea = $("#claimEntry-desc");
                        var scrollHeight = txtArea[0].scrollHeight;
                        txtArea.height(scrollHeight > 500 ? 500 : scrollHeight);
                    }, 3);
                    Audit.info('ViewTask', {_id: this.claimEntry()._id(), summary: this.claimEntry().claimId()});
                }.bind(this));
        };

        TaskEntryVM.prototype.storeInSession = function (claimEntryId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID, claimEntryId);
            console.log('Stored CliamEntryId: ' + claimEntryId + ' in session storage');
        };

        TaskEntryVM.prototype.onCancel = function () {
            var self = this;

            function navigateAway() {
                Router.routeToClaim(Session.getActiveClaimId());
            }

            if (this.stateChange()) {
                bootbox.dialog({
                    title: "Unsaved Changes!",
                    message: "Save? ",
                    buttons: {
                        no: {
                            label: "No",
                            className: "btn-danger",
                            callback: function () {
                                navigateAway();
                            }
                        },
                        yes: {
                            label: "Yes",
                            className: "btn-info",
                            callback: function () {
                                self.onSave().then(function onDone() {
                                    navigateAway();
                                });
                            }
                        }
                    }
                });
            } else {
                navigateAway();
            }
        };

        return {viewModel: TaskEntryVM, template: taskEntryView};
    });