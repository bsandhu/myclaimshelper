define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/billingItem', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'shared/dateUtils',
        'text!app/components/taskEntry/taskEntry.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, BillingItem, States, ajaxUtils, Events, Router, SessionKeys, DateUtils, taskEntryView) {
        'use strict';

        function TaskEntryVM() {
            console.log('Init TaskEntryVM');
            this.DateUtils = DateUtils;

            // Model
            this.claimEntry = ko.observable(this.newEmptyClaimEntry());

            // View state
            this.inEditMode = ko.observable(true);
            this.stateChange = ko.observable(false);

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
            entryObjWithObserAttrs.entryDate(new Date());
            entryObjWithObserAttrs.state(States.TODO);
            return entryObjWithObserAttrs;
        };

        /**
         * Tracks changes to the Claim entry object. Used to highlight 'save' button on the UI
         */
        TaskEntryVM.prototype.startStateTracking = function () {
            this.claimEntryState = ko.computed(function () {
                return KOMap.toJSON(this.claimEntry);
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
            console.log('Adding new claim entry. Tag:' + tag);
        };

        /**
         * @param evData {'claimEntryId': entry._id, 'status': status});
         */
        TaskEntryVM.prototype.onStatusUpdate = function (evData) {
            console.log('TaskEntryVM - UPDATE_CLAIM_ENTRY_STATUS ev ' + JSON.stringify(evData));

            var claimEntryId = evData.claimEntryId;
            var claimId = this.getActiveClaimId();

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

        TaskEntryVM.prototype.onSave = function () {
            console.log('Saving ClaimEntry: ' + KOMap.toJSON(this.claimEntry));
            this.stopStateTracking();

            var activeClaimId = this.getActiveClaimId();
            this.claimEntry().claimId(activeClaimId);
            this.claimEntry().entryDate();

            ajaxUtils.post(
                '/claimEntry',
                KOMap.toJSON(this.claimEntry),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved entry'});
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: activeClaimId, claimEntryId: response.data._id});

                    this.startStateTracking();
                }.bind(this));
        };

        TaskEntryVM.prototype.loadClaimEntry = function (claimEntryId) {
            this.stopStateTracking();

            $.getJSON('/claimEntry/' + claimEntryId)
                .done(function (resp) {
                    console.log('Loaded claim entry ' + JSON.stringify(resp.data));

                    // Populate with JSON data
                    KOMap.fromJS(resp.data[0], {}, this.claimEntry);

                    // Put in session
                    this.storeInSession(this.claimEntry()._id());

                    this.startStateTracking();

                    window.setTimeout(function setT() {
                        var txtArea = $("#claimEntry-desc");
                        txtArea.height(60);
                        var scrollHeight = txtArea[0].scrollHeight;
                        txtArea.height(scrollHeight > 500 ? 500 : scrollHeight);
                    }, 1);

                }.bind(this));
        };

        /**
         * Since only once Claim can be active, its assumed to be the parent
         */
        TaskEntryVM.prototype.getActiveClaimId = function () {
            var activeClaimId = amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID);
            console.assert(activeClaimId, 'No claim active in session');
            return activeClaimId;
        };

        TaskEntryVM.prototype.storeInSession = function (claimEntryId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID, claimEntryId);
            console.log('Stored CliamEntryId: ' + claimEntryId + ' in session storage');
        };

        TaskEntryVM.prototype.onCancel = function () {
            Router.routeToClaim(this.getActiveClaimId());
        };

        return {viewModel: TaskEntryVM, template: taskEntryView};
    });