define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'app/utils/dateUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, ajaxUtils, Events, Router, SessionKeys, DateUtils) {
        'use strict';

        function ClaimEntryVM() {
            console.log('Init ClaimEntryVM');

            // Model
            this.claimEntry = ko.observable(this.newEmptyClaimEntry());

            // View state
            this.inEditMode = ko.observable(true);
            this.stateChange = ko.observable(false);

            this.setupEvListeners();
            this.startStateTracking();
        }

        ClaimEntryVM.prototype.startStateTracking = function () {
            this.claimEntryState = ko.computed(function(){
                return KOMap.toJSON(this.claimEntry);
            }, this);
            this.claimEntryState.extend({ rateLimit: { timeout: 100, method: "notifyWhenChangesStop" } });

            this.stateChangeSubsciption = this.claimEntryState.subscribe(function(val){
                this.stateChange(true);
                console.log('ClaimEntry state change');
            }, this);
        };

        ClaimEntryVM.prototype.stopStateTracking = function () {
            this.stateChangeSubsciption.dispose();
            this.stateChange(false);
        };

        ClaimEntryVM.prototype.newEmptyClaimEntry = function () {
            var jsEntryObject = new ClaimEntry();
            var entryObjWithObservableAttributes = KOMap.fromJS(jsEntryObject);
            return entryObjWithObservableAttributes;
        };

        ClaimEntryVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.onNewClaimEntry);
            amplify.subscribe(Events.UPDATE_CLAIM_ENTRY_STATUS, this, this.onStatusUpdate);
        };

        ClaimEntryVM.prototype.onShowClaimEntry = function (evData) {
            console.log('Display claimEntryId: ' + JSON.stringify(evData));
            this.loadClaimEntry(evData.claimEntryId);
        };

        ClaimEntryVM.prototype.onNewClaimEntry = function (evData) {
            var tag = Boolean(evData.entryType) ? evData.entryType : 'other';

            this.claimEntry(this.newEmptyClaimEntry());
            this.claimEntry().tag([tag]);
            this.claimEntry().entryDate(DateUtils.toDatetimePickerFormat(new Date()));
            this.claimEntry().state(States.TODO);

            console.log('Adding new claim entry. Tag:' + tag);
        };

        /**
         * @param evData {'claimEntryId': entry._id, 'status': status});
         */
        ClaimEntryVM.prototype.onStatusUpdate = function(evData){
            console.log('Modify ClaimEntry: ' + JSON.stringify(evData));
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

        ClaimEntryVM.prototype.niceHeader = function () {
            return (this.claimEntry()._id === undefined)
                ? 'New Entry'
                : this.claimEntry().summary() || '';
        };

        ClaimEntryVM.prototype.onSave = function () {
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

        ClaimEntryVM.prototype.loadClaimEntry = function (claimEntryId) {
            this.stopStateTracking();

            $.get('/claimEntry/' + claimEntryId)
                .done(function (resp) {
                    console.log('Loaded claim entry ' + JSON.stringify(resp.data));

                    // Populate with JSON data
                    KOMap.fromJS(resp.data[0], {}, this.claimEntry);

                    // Put in session
                    this.storeInSession(this.claimEntry()._id());

                    this.startStateTracking();

                    window.setTimeout(function setT() {
                        var txtArea = $("#claimEntry-textArea");
                        txtArea.height(60);
                        var scrollHeight = txtArea[0].scrollHeight;
                        txtArea.height(scrollHeight > 500 ? 500 : scrollHeight);
                    }, 1);

                }.bind(this));
        };

        /**
         * Since only once Claim can be active, its assumed to be the parent
         */
        ClaimEntryVM.prototype.getActiveClaimId = function () {
            var activeClaimId = amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID);
            console.assert(activeClaimId, 'No claim active in session');
            return activeClaimId;
        };

        ClaimEntryVM.prototype.storeInSession = function (claimEntryId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID, claimEntryId);
            console.log('Stored CliamEntryId: ' + claimEntryId + ' in session storage');
        };

        ClaimEntryVM.prototype.onCancel = function () {
            Router.routeToClaim(this.getActiveClaimId());
        };



        return ClaimEntryVM;
    });