define(['jquery', 'knockout', 'KOMap', 'amplify',
        'model/claim', 'model/claimEntry', 'model/contact', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'app/utils/dateUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Contact, States,
              ajaxUtils, Events, Router, SessionKeys, DateUtils) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this.States = States;
            this.DateUtils = DateUtils;
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();
            this.sortDir = ko.observable('desc');

            // View state
            this.screenHeight = ko.observable(screen.height);
            this.inEditMode = ko.observable(false);
            this.showStatusForEntryId = ko.observable();
            this.setupEvListeners();
        }

        ClaimVM.prototype.newEmptyClaim = function () {
            var jsClaimObject = new Claim();
            jsClaimObject.claimantsAttorneyContact = new Contact();
            jsClaimObject.claimantContact = new Contact();
            jsClaimObject.insuredAttorneyContact = new Contact();
            jsClaimObject.insuredContact = new Contact();
            jsClaimObject.insuranceCoContact = new Contact();

            var claimObjWithObservableAttributes = KOMap.fromJS(jsClaimObject);
            return claimObjWithObservableAttributes;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.onNewClaimEntry);
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.refreshClaimEntriesListing);
            window.onclick = this.onDismissStatus.bind(this);
        };

        ClaimVM.prototype.onEditModeClick = function () {
            this.inEditMode(true);
        };

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('ClaimVM - SHOW_CLAIM ev' + JSON.stringify(evData));
            console.assert(evData.claimId, 'Expecting claim Id on event data');

            // Need to load?
            if (String(this.claim()._id()) === String(evData.claimId)) {
                console.log('Claim Id ' + evData.claimId + ' already loaded. Skipping');
                return;
            }
            // Clear
            this.claim(this.newEmptyClaim());
            // Re-load
            this.loadClaim(evData.claimId);
            this.loadEntriesForClaim(evData.claimId);
            this.inEditMode(false);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('ClaimVM - NEW_CLAIM ev');
            this.claim(this.newEmptyClaim());
            this.claim().entryDate(new Date());
            this.claimEntries([]);
            this.inEditMode(true);
        };

        ClaimVM.prototype.onNewClaimEntry = function () {
            console.log('ClaimVM - NEW_CLAIM_ENTRY ev');
            if (!this.claim()._id()) {
                console.log('Adding entry to unsaved claim. Saving.');
                this.onSave();
            }
        };

        ClaimVM.prototype.onShowClaimEntry = function (evData) {
            console.log('ClaimVM - SHOW_CLAIM_ENTRY ev ' + JSON.stringify(evData));
            this.onShowClaim({claimId: evData.claimId});
        };

        ClaimVM.prototype.onEntryStatusUpdate = function (status, entry, ev) {
            console.log('Raise Claim Entry status update Ev. ' + entry._id);
            amplify.publish(Events.UPDATE_CLAIM_ENTRY_STATUS, {'claimEntryId': entry._id, 'status': status});
            ev.stopImmediatePropagation();
            this.onDismissStatus();
        };

        ClaimVM.prototype.onStatusFocus = function (evData, ev) {
            this.showStatusForEntryId(evData._id);
            ev.stopPropagation();
        };

        ClaimVM.prototype.onDismissStatus = function () {
            this.showStatusForEntryId(null);
        };

        ClaimVM.prototype.onCancel = function () {
            Router.routeToHome();
        };

        ClaimVM.prototype.onClaimEntryClick = function (entry, ev) {
            // Toggle row highlight
            $('#claimEntriesList tr').removeClass('info');
            $(ev.target).closest('tr').addClass('info');

            Router.routeToClaimEntry(this.claim()._id(), entry._id);
        };

        /***********************************************************/
        /* View state                                              */
        /***********************************************************/

        ClaimVM.prototype.onSortEntries = function () {
            this.sortDir(this.sortDir() === 'desc' ? 'asc' : 'desc');
            this.sortEntries();
        };

        ClaimVM.prototype.sortEntries = function () {
            function sortAsc(a, b) {
                var dateA = new Date(Date.parse(a.entryDate));
                var dateB = new Date(Date.parse(b.entryDate));
                return dateA.getTime() - dateB.getTime();
            }

            function sortDesc(a, b) {
                var dateA = new Date(Date.parse(a.entryDate));
                var dateB = new Date(Date.parse(b.entryDate));
                return dateB.getTime() - dateA.getTime();
            }

            var tmpArray = this.claimEntries.removeAll();
            tmpArray.sort(this.sortDir() === 'desc' ? sortDesc : sortAsc);
            this.claimEntries(tmpArray);
        };

        ClaimVM.prototype.refreshClaimEntriesListing = function () {
            var claimId = this.claim()._id();
            console.log('Refresh entries list. ClaimId ' + claimId);
            this.loadEntriesForClaim(claimId);
        };

        ClaimVM.prototype.niceName = function (contact) {
            var nice = (contact.firstName() || '') + (contact.lastName() || '');
            return nice.length > 0 ? nice : 'None';

        };

        /***********************************************************/
        /* Server calls                                            */
        /***********************************************************/

        ClaimVM.prototype.onSave = function () {
            console.log('Saving Claim: ' + KOMap.toJSON(this.claim));

            ajaxUtils.post(
                '/claim',
                KOMap.toJSON(this.claim),
                function onSuccess(response) {
                    console.log('Saved claim: ' + JSON.stringify(response));

                    // Update Ids gen. by the server
                    this.claim()._id(response.data._id);
                    this.claim().insuredContact._id(response.data.insuredContactId);
                    this.claim().insuredAttorneyContact._id(response.data.insuredAttorneyContactId);
                    this.claim().claimantContact._id(response.data.claimantContactId);
                    this.claim().claimantsAttorneyContact._id(response.data.claimantsAttorneyContactId);
                    this.claim().insuranceCoContact._id(response.data.insuranceCoContactId);

                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved Claim'});
                    this.storeInSession(this.claim()._id());
                    this.inEditMode(false);
                }.bind(this));
        };

        ClaimVM.prototype.loadClaim = function (claimId) {
            $.getJSON('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId);
                }.bind(this));
        };

        ClaimVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data));
                    this.claimEntries(resp.data);
                    this.sortEntries();
                }.bind(this));
        };

        ClaimVM.prototype.storeInSession = function (claimId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID, claimId);
            console.log('Stored ClaimId: ' + claimId + ' in session storage');
        };

        ClaimVM.prototype.getActiveClaimEntryId = function () {
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID);
        };

        return ClaimVM;
    });