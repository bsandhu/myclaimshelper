define(['jquery', 'knockout', 'KOMap', 'amplify',
        'model/claim', 'model/claimEntry', 'model/contact',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router', 'app/utils/sessionKeys',
        'app/utils/dateUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Contact, ajaxUtils, Events, Router, SessionKeys, DateUtils) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();
            this.sortDir = ko.observable('desc');

            // View state
            this.inEditMode = ko.observable(false);
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

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.isClaimSaved);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.refreshClaimEntriesListing);
        };

        ClaimVM.prototype.onEditModeClick = function () {
            this.inEditMode(true);
        };

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

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('Display claimId: ' + JSON.stringify(evData));
            this.claim(this.newEmptyClaim());

            this.loadClaim(evData.claimId);
            this.loadEntriesForClaim(evData.claimId);
            this.inEditMode(false);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('Adding new claim');
            this.claim(this.newEmptyClaim());
            this.claim().entryDate(DateUtils.toDatetimePickerFormat(new Date()));
            this.claimEntries([]);
            this.inEditMode(true);
        };

        ClaimVM.prototype.refreshClaimEntriesListing = function () {
            var claimId = this.claim()._id();
            console.log('Refresh entries list. ClaimId ' + claimId);
            this.loadEntriesForClaim(claimId);
        };

        ClaimVM.prototype.isClaimSaved = function () {
            if (!this.claim()._id()) {
                console.log('Adding entry to unsaved claim. Saving.');
                this.onSave();
            }
        };

        ClaimVM.prototype.niceName = function (contact) {
            var nice = (contact.firstName() || '') + (contact.lastName() || '');
            return nice.length > 0 ? nice : 'None';

        };

        ClaimVM.prototype.onCancel = function () {
            Router.routeToHome();
        };

        ClaimVM.prototype.onClaimEntryClick = function (entry, ev) {
            // Toggle row highlight
            $('#claimEntriesList div[class|="listItem listItemSelected"]').removeClass('listItemSelected');
            $(ev.target).closest('div[class="listItem"]').addClass('listItemSelected');

            Router.routeToClaimEntry(entry._id);
        };

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
                    this.sortEntries();
                }.bind(this));
        };

        ClaimVM.prototype.storeInSession = function (claimId) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID, claimId);
            console.log('Stored CliamId: ' + claimId + ' in session storage');
        };

        ClaimVM.prototype.getActiveClaimEntryId = function () {
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID);
        };

        return ClaimVM;
    });