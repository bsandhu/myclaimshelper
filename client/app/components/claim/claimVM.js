define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore',
        'model/claim', 'model/claimEntry', 'model/contact', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts', 'app/utils/router',
        'app/utils/sessionKeys', 'app/utils/session', 'app/components/contact/contactClient',
        'shared/dateUtils', 'text!app/components/claim/claim.tmpl.html'],
    function ($, ko, KOMap, amplify, _, Claim, ClaimEntry, Contact, States,
              ajaxUtils, Events, Consts, Router, SessionKeys, Session, ContactClient,
              DateUtils, viewHtml) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this._ = _;
            this.States = States;
            this.Consts = Consts;
            this.DateUtils = DateUtils;
            this.Router = Router;
            this.Session = Session;
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();
            this.sortDir = ko.observable('desc');
            this.activeTab = ko.observable(Consts.CLAIMS_TAB);
            this.isPartiallyCollapsed = ko.observable(false);

            // View state
            this.isClaimClosed = ko.computed(function(){return this.claim().isClosed();}, this);
            this.screenHeight = ko.observable($(window).height() - 215);
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
            jsClaimObject.dateOfLoss = new Date();
            jsClaimObject.dateDue = new Date();
            jsClaimObject.dateReceived = new Date();

            var claimObjWithObservableAttributes = KOMap.fromJS(jsClaimObject);
            return claimObjWithObservableAttributes;
        };

        /***********************************************************/
        /* Event handlers                                          */
        /***********************************************************/

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.refreshClaimEntriesListing);
            amplify.subscribe(Events.EXPAND_CLAIM_PANEL, this, function(){this.isPartiallyCollapsed(false)});
            amplify.subscribe(Events.COLLAPSE_CLAIM_PANEL, this, function(){this.isPartiallyCollapsed(false)});
            amplify.subscribe(Events.PARTIALLY_COLlAPSE_CLAIM_PANEL, this, function(){this.isPartiallyCollapsed(true)});

            window.onclick = this.onDismissStatus.bind(this);
        };

        ClaimVM.prototype.onEditModeClick = function () {
            this.inEditMode(true);
        };

        ClaimVM.prototype.onCloseClaimClick = function () {
            console.log('ClaimVM - Closing claim');
            this.claim().isClosed(true);
            this.claim().dateClosed(new Date());
            this.onSave();
        };

        ClaimVM.prototype.onReOpenClaimClick = function () {
            console.log('ClaimVM - ReOpen claim');
            this.claim().isClosed(false);
            this.onSave();
        };

        ClaimVM.prototype.onBillingProfileClick = function () {
            console.log('ClaimVM - BillingProfile for claim');
            if (this.claim()._id()){
                this.Router.routeToBillingProfile(this.claim()._id());
            } else {
                amplify.publish(Events.INFO_NOTIFICATION, {msg: 'Please save the Claim before modiying Billing rates'})
            }
        };

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('ClaimVM - SHOW_CLAIM ev' + JSON.stringify(evData));
            console.assert(evData.claimId, 'Expecting claim Id on event data');
            this.selectClaimTab();

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
            this.selectClaimTab();
        };

        ClaimVM.prototype.onShowClaimEntry = function (evData) {
            console.log('ClaimVM - SHOW_CLAIM_ENTRY ev ' + JSON.stringify(evData));
            this.onShowClaim({claimId: evData.claimId});
        };

        ClaimVM.prototype.onShowContact = function (contactObservable) {
            console.log('ClaimVM - SHOW_CONTACT ev ' + JSON.stringify(KOMap.toJS(contactObservable)));
            if (!Boolean(contactObservable._id())){
                this.inEditMode(true);
                amplify.publish(Events.INFO_NOTIFICATION, {msg: 'Please add contact information'})
            } else {
                amplify.publish(Events.SHOW_CONTACT, {contactId: contactObservable._id()});
            }
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

        ClaimVM.prototype.onDismissStatus = function (evData, ev) {
            this.showStatusForEntryId(null);
            if (ev) {
                ev.stopPropagation();
            }
        };

        ClaimVM.prototype.onCancel = function () {
            this.inEditMode(false);
        };

        ClaimVM.prototype.onShowClaimTab = function (entry, ev) {
            this.Router.routeToClaim(this.claim()._id());
        }

        ClaimVM.prototype.selectClaimTab = function () {
            console.log("Switch to Claim tab");
            this.activeTab(Consts.CLAIMS_TAB);
        };

        ClaimVM.prototype.onClaimEntryClick = function (entry, ev) {
            // Toggle row highlight
            $('#claimEntriesList tr').removeClass('info');
            $(ev.target).closest('tr').addClass('info');

            Router.routeToClaimEntry(this.claim()._id(), entry._id);
        };

        ClaimVM.prototype.onAddContact = function (contact) {
            amplify.publish(Events.ADD_CONTACT);
        }

        ClaimVM.prototype.onCloseClaim = function (contact) {
            Router.routeToHome();
        }

        ClaimVM.prototype.onToggleAtty = function (elemId) {
            var elem = $(elemId);

            if (elem.is(':visible')){
                elem.velocity("slideUp", { duration: 500 });
            } else {
                elem.velocity("slideDown", { duration: 500 });
            }
        }

        /***********************************************************/
        /* View state                                              */
        /***********************************************************/


        ClaimVM.prototype.initTooltipComponent = function () {
            $('[data-toggle="tooltip"]').tooltip();
        };

        ClaimVM.prototype.showTasksCollapsed = function () {
            $(window).resize(function(){
                if ($(window).width() < 768){
                    amplify.publish()
                }
            });
        }

        ClaimVM.prototype.onSortEntries = function () {
            this.sortDir(this.sortDir() === 'desc' ? 'asc' : 'desc');
            this.sortEntries();
        };

        ClaimVM.prototype.sortEntries = function () {
            function sortAsc(a, b) {
                var dateA = new Date(Date.parse(a.dueDate));
                var dateB = new Date(Date.parse(b.dueDate));
                return dateA.getTime() - dateB.getTime();
            }

            function sortDesc(a, b) {
                var dateA = new Date(Date.parse(a.dueDate));
                var dateB = new Date(Date.parse(b.dueDate));
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
            var nice = contact.name() || '';
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
                    console.log('Saved claim');

                    // Update Ids gen. by the server
                    this.claim()._id(response.data._id);
                    this.claim().insuredContact._id(response.data.insuredContactId);
                    this.claim().insuredAttorneyContact._id(response.data.insuredAttorneyContactId);
                    this.claim().claimantContact._id(response.data.claimantContactId);
                    this.claim().claimantsAttorneyContact._id(response.data.claimantsAttorneyContactId);
                    this.claim().insuranceCoContact._id(response.data.insuranceCoContactId);

                    ContactClient.updateInSession(KOMap.toJS(this.claim().insuredContact));
                    ContactClient.updateInSession(KOMap.toJS(this.claim().insuredAttorneyContact));
                    ContactClient.updateInSession(KOMap.toJS(this.claim().claimantContact));
                    ContactClient.updateInSession(KOMap.toJS(this.claim().claimantsAttorneyContact));
                    ContactClient.updateInSession(KOMap.toJS(this.claim().insuranceCoContact));

                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Updated Claim ' + this.claim().insuranceCompanyFileNum()});
                    amplify.publish(Events.ADDED_CONTACT, KOMap.toJS(this.claim().insuredContact));
                    amplify.publish(Events.SAVED_CLAIM, {'claim': KOMap.toJS(this.claim())});

                    this.storeInSession(this.claim()._id(), KOMap.toJS(this.claim()));
                    this.inEditMode(false);
                }.bind(this));
        };

        ClaimVM.prototype.loadClaim = function (claimId) {
            $.getJSON('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId, resp.data);
                }.bind(this));
        };

        ClaimVM.prototype.loadEntriesForClaim = function (claimId) {
            $.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data.length));
                    this.claimEntries(resp.data);
                    this.sortEntries();
                }.bind(this));
        };

        ClaimVM.prototype.storeInSession = function (claimId, claim) {
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID, claimId);
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_OBJ, claim);
            console.log('Stored ClaimId: ' + claimId + ' in session storage');
        };

        ClaimVM.prototype.getActiveClaimEntryId = function () {
            return amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ENTRY_ID);
        };

        return ClaimVM;
    });