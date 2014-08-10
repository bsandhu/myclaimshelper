define(['jquery', 'knockout', 'KOMap', 'amplify',
        'model/claim', 'model/claimEntry',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, ajaxUtils, Events, Router, SessionKeys) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();

            // View state
            this.inEditMode = ko.observable(true);
            this.setupEvListeners();
        };

        ClaimVM.prototype.newEmptyClaim = function(){
            var jsClaimObject = new Claim();
            var claimObjWithObservableAttributes = KOMap.fromJS(jsClaimObject);
            return claimObjWithObservableAttributes;
        };

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.isClaimSaved);
        };

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('Display claimId: ' + JSON.stringify(evData));
            this.claim(this.newEmptyClaim());

            this.loadClaim(evData.claimId);
            this.loadEntriesForClaim(evData.claimId);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('Adding new claim');
            this.claim(this.newEmptyClaim());
            this.claim().entryDate(new Date());
        };

        ClaimVM.prototype.isClaimSaved = function () {
            if (!this.claim()._id()) {
                console.log('Adding entry to unsaved claim. Saving.');
                this.onSave();
            }
        };

        ClaimVM.prototype.onCancel = function () {
            Router.routeToHome();
        };

        ClaimVM.prototype.onClaimEntryClick = function (entry) {
            Router.routeToClaimEntry(entry._id);
        };

        ClaimVM.prototype.onSave = function () {
            console.log('Saving Claim: ' + KOMap.toJSON(this.claim));

            ajaxUtils.post(
                '/claim',
                KOMap.toJSON(this.claim),
                function onSuccess(response) {
                    console.log('Saved claim: ' + JSON.stringify(response));
                    this.claim()._id(response.data._id);
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Claim'});
                    this.storeInSession(this.claim()._id());
                }.bind(this));
        };

        ClaimVM.prototype.loadClaim = function (claimId) {
            $.get('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId);
                }.bind(this));
        };

        ClaimVM.prototype.loadEntriesForClaim = function (claimId) {
            $.get('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                }.bind(this));
        };

        ClaimVM.prototype.storeInSession = function(claimId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID, claimId);
            console.log('Stored CliamId: ' + claimId + ' in session storage');
        };

        return ClaimVM;
    });