define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'app/utils/dateUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, ajaxUtils, Events, Router, SessionKeys, DateUtils) {
        'use strict';

        function ClaimEntryVM() {
            console.log('Init ClaimEntryVM');

            // Model
            this.claimEntry = ko.observable(this.newEmptyClaimEntry());

            // View state
            this.inEditMode = ko.observable(true);
            this.setupEvListeners();
        }

        ClaimEntryVM.prototype.newEmptyClaimEntry = function(){
            var jsEntryObject = new ClaimEntry();
            var entryObjWithObservableAttributes = KOMap.fromJS(jsEntryObject);
            return entryObjWithObservableAttributes;
        };

        ClaimEntryVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.onNewClaimEntry);
        };

        ClaimEntryVM.prototype.onShowClaimEntry = function (evData) {
            console.log('Display claimEntryId: ' + JSON.stringify(evData));
            this.loadClaimEntry(evData.claimEntryId);
        };

        ClaimEntryVM.prototype.onNewClaimEntry = function (evData) {
            console.log('Adding new claim entry');
            this.claimEntry(this.newEmptyClaimEntry());
            this.claimEntry().entryDate(DateUtils.toDatetimePickerFormat(new Date()));
        };

        /**
         * Since only once Claim can be active, its assumed to be the parent
         */
        ClaimEntryVM.prototype.getActiveClaimId = function () {
            var activeClaimId = amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID);
            console.assert(activeClaimId, 'No claim active in session');
            return activeClaimId;
        };

        ClaimEntryVM.prototype.onSave = function () {
            console.log('Saving ClaimEntry: ' + KOMap.toJSON(this.claimEntry));

            var activeClaimId = this.getActiveClaimId();
            this.claimEntry().claimId(activeClaimId);

            ajaxUtils.post(
                '/claimEntry',
                KOMap.toJSON(this.claimEntry),
                function onSuccess(response) {
                    console.log('Saved ClaimEntry: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved entry'});
                    amplify.publish(Events.SAVED_CLAIM_ENTRY, {claimId: activeClaimId, claimEntryId: response.data._id});
                });
        };

        ClaimEntryVM.prototype.loadClaimEntry = function (claimEntryId) {
            $.get('/claimEntry/' + claimEntryId)
                .done(function (resp) {
                    console.log('Loaded claim entry ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.claimEntry);

                    // TODO figure out if we need to track selected claim entry in session
                    //  this.storeInSession(claimEntryId);
                }.bind(this));
        };

        ClaimEntryVM.prototype.onCancel = function () {
            Router.routeToClaim(this.getActiveClaimId());
        };

        return ClaimEntryVM;
    });