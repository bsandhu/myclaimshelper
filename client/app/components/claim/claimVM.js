define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore', 'bootbox',
        'model/claim', 'model/claimEntry', 'model/contact', 'model/states',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/consts', 'app/utils/router',
        'app/utils/sessionKeys', 'app/utils/session', 'app/components/contact/contactClient',
        'shared/dateUtils', 'shared/consts', 'shared/objectUtils', 'shared/NumberUtils',
        'text!app/components/claim/claim.tmpl.html',
        'text!app/components/claim/claim.editor.tmpl.html',
        'text!app/components/claim/claim.docs.tmpl.html',
        'text!app/components/claim/claim.entries.tmpl.html',
        'text!app/components/claim/claim.forms.tmpl.html',
        'text!app/components/claim/claim.print.tmpl.html',
        'text!app/components/claim/contact.print.tmpl.html',
        'app/utils/audit'],
    function ($, ko, KOMap, amplify, _, bootbox, Claim, ClaimEntry, Contact, States, ajaxUtils,
              Events, Consts, Router, SessionKeys, Session, ContactClient, DateUtils, SharedConsts, ObjectUtils, NumberUtils,
              viewHtml, editorViewHtml, docsViewHtml, entriesViewHtml, formsViewHtml, printHtml, contactPrintTmpl, Audit) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this._ = _;
            this.$ = $;
            this.States = States;
            this.Consts = Consts;
            this.DateUtils = DateUtils;
            this.ObjectUtils = ObjectUtils;
            this.NumberUtils = NumberUtils;
            this.Router = Router;
            this.Session = Session;
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();

            this.claimForms = ko.observableArray();
            this.sortDir = ko.observable('desc');
            this.activeTab = ko.observable(Consts.CLAIMS_TAB);
            this.activeClaimEntryId = ko.observable();
            this.isPartiallyCollapsed = ko.observable(false);
            this.entriesViewHtml = entriesViewHtml;
            this.editorViewHtml = editorViewHtml;
            this.docsViewHtml = docsViewHtml;
            this.formsViewHtml = formsViewHtml;
            this.contactPrintTmpl = contactPrintTmpl;
            this.vm = this;

            // View state
            this.readyToRender = ko.observable(false);
            this.isClaimClosed = ko.computed(function () {
                return this.claim().isClosed();
            }, this);
            this.screenHeight = ko.observable($(window).height() - 215);
            this.inEditMode = ko.observable(false);
            this.showStatusForEntryId = ko.observable();
            this.bottomPanel = ko.observable(Consts.CLAIMS_TAB_TASKS);

            // Profile based access
            this.isBillingEnabled = ko.observable(false);

            this.setupEvListeners();
            this.setupDocsToList();
        }

        ClaimVM.prototype.newEmptyClaim = function () {
            let jsClaimObject = new Claim();
            jsClaimObject.dateOfLoss = DateUtils.startOfToday();
            jsClaimObject.dateDue = DateUtils.startOfToday();
            jsClaimObject.dateReceived = DateUtils.startOfToday();
            jsClaimObject.validFromDate = DateUtils.startOfToday();
            jsClaimObject.validToDate = DateUtils.startOfToday();
            jsClaimObject.attachments = [];
            jsClaimObject.location = undefined;
            jsClaimObject.lossType = undefined;

            let claimObjWithObservableAttributes = KOMap.fromJS(jsClaimObject);
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
            amplify.subscribe(Events.SAVED_CLAIM_FORM, this, this.refreshFormsListing);
            amplify.subscribe(Events.EXPAND_CLAIM_PANEL, this, function () {
                this.isPartiallyCollapsed(false)
            });
            amplify.subscribe(Events.COLLAPSE_CLAIM_PANEL, this, function () {
                this.isPartiallyCollapsed(false)
            });
            amplify.subscribe(Events.PARTIALLY_COLlAPSE_CLAIM_PANEL, this, function () {
                this.isPartiallyCollapsed(true)
            });
            amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                this.isBillingEnabled(Session.getCurrentUserProfile().isBillingEnabled);
            });
            window.onclick = this.onDismissStatus.bind(this);
        };

        ClaimVM.prototype.onEditModeClick = function () {
            this.inEditMode(true);
        };

        ClaimVM.prototype.onCloseClaimClick = function () {
            console.log('ClaimVM - Closing claim');
            this.onClose(false);
        };

        ClaimVM.prototype.onReOpenClaimClick = function () {
            console.log('ClaimVM - ReOpen claim');
            this.claim().isClosed(false);
            this.onSave();
        };

        ClaimVM.prototype.onBillingProfileClick = function () {
            console.log('ClaimVM - BillingProfile for claim');
            if (this.claim()._id()) {
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
            this.loadFormsForClaim(evData.claimId);
            this.inEditMode(false);
            this.readyToRender(true);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('ClaimVM - NEW_CLAIM ev');
            this.claim(this.newEmptyClaim());
            this.claim().entryDate(new Date());
            this.claimEntries([]);
            this.inEditMode(true);
            this.selectClaimTab();
            this.readyToRender(true);
        };

        ClaimVM.prototype.onShowClaimEntry = function (evData) {
            console.log('ClaimVM - SHOW_CLAIM_ENTRY ev ' + JSON.stringify(evData));
            this.onShowClaim({claimId: evData.claimId});
        };

        ClaimVM.prototype.onShowContact = function (contactObservable) {
            console.log('ClaimVM - SHOW_CONTACT ev ' + JSON.stringify(KOMap.toJS(contactObservable)));
            if (!Boolean(contactObservable._id())) {
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
            this.activeClaimEntryId(entry._id);
            Router.routeToClaimEntry(this.claim()._id(), entry._id);
        };

        ClaimVM.prototype.onClaimFormClick = function (form, ev) {
            Router.routeToClaimForm(form._id);
        };

        ClaimVM.prototype.onAddNewOtherContact = function () {
            // Sub-category is added by the selection ui
            this._onAddNewContact(SharedConsts.CONTACT_CATEGORY_OTHER);
        };

        ClaimVM.prototype.onAddNewInsuredContact = function () {
            this._onAddNewContact(SharedConsts.CONTACT_CATEGORY_INSURED, SharedConsts.CONTACT_SUBCATEGORY_INSURED);
        };

        ClaimVM.prototype.onAddNewInsuredAttyContact = function () {
            this._onAddNewContact(SharedConsts.CONTACT_CATEGORY_INSURED, SharedConsts.CONTACT_CATEGORY_INSURED_ATTY);
        };

        ClaimVM.prototype.onAddNewClaimantContact = function () {
            this._onAddNewContact(SharedConsts.CONTACT_CATEGORY_CLAIMANT, SharedConsts.CONTACT_SUBCATEGORY_CLAIMANT);
        };

        ClaimVM.prototype.onAddNewClaimantAttyContact = function () {
            this._onAddNewContact(SharedConsts.CONTACT_CATEGORY_CLAIMANT, SharedConsts.CONTACT_CATEGORY_CLAIMANT_ATTY);
        };

        ClaimVM.prototype._onAddNewContact = function (category, subCategory) {
            this.claim().contacts.push(
                KOMap.fromJS({
                    category: category,
                    subCategory: subCategory,
                    contact: new Contact()
                }));
        }

        ClaimVM.prototype.onDeleteContact = function (index, contact, mouseEvent) {
            let dialog = bootbox.dialog({
                title: "",
                message: "Remove contact from Claim?",
                size: "small",
                buttons: {
                    no: {label: "No", className: "btn-danger", callback: $.noop},
                    yes: {label: "Yes", className: "btn-info", callback: onConfirm.bind(this)}
                }
            });
            dialog.find('.modal-dialog')
                .css({
                    'margin-left':  mouseEvent.x + 'px'
                });
            dialog.find('.modal-content')
                .css({
                    'margin-top': () => mouseEvent.y + 'px',
                });
            dialog.find('.modal-footer')
                .css({
                    'border-top': () => 'none',
                });

            function onConfirm() {
                let arr = this.claim().contacts();
                this.claim().contacts(arr.filter((elem, idx) => idx != index));
            }
        }

        ClaimVM.prototype.otherContacts = function () {
            return _.filter(this.claim().contacts(), contact => contact.category() == 'Other');
        }

        ClaimVM.prototype.insuredContacts = function () {
            return _.filter(this.claim().contacts(), contact => contact.category() == 'Insured');
        }

        ClaimVM.prototype.claimantContacts = function () {
            return _.filter(this.claim().contacts(), contact => contact.category() == 'Claimant');
        }

        ClaimVM.prototype.onAddNewExpense = function () {
            this.claim().expenses.push(
                KOMap.fromJS({
                    category: SharedConsts.EXPENSE_CATEGORY,
                    subCategory: null,
                    amount: 0
                }));
        }

        ClaimVM.prototype.onDeleteExpense = function (index, expense, mouseEvent) {
            let dialog = bootbox.dialog({
                title: "",
                message: "Remove expense from Claim?",
                size: "small",
                buttons: {
                    no: {label: "No", className: "btn-danger", callback: $.noop},
                    yes: {label: "Yes", className: "btn-info", callback: onConfirm.bind(this)}
                }
            });
            dialog.find('.modal-dialog')
                .css({
                    'margin-left':  mouseEvent.x + 'px'
                });
            dialog.find('.modal-content')
                .css({
                    'margin-top': () => mouseEvent.y + 'px',
                });
            dialog.find('.modal-footer')
                .css({
                    'border-top': () => 'none',
                });
            function onConfirm() {
                let arr = this.claim().expenses();
                this.claim().expenses(arr.filter((elem, idx) => idx != index));
            }
        }

        ClaimVM.prototype.onCloseClaim = function () {
            Router.routeToHome();
        }

        ClaimVM.prototype.onTasksViewClick = function () {
            this.bottomPanel(Consts.CLAIMS_TAB_TASKS);
        }

        ClaimVM.prototype.onDocsViewClick = function () {
            this.bottomPanel(Consts.CLAIMS_TAB_DOCS);
        }

        /***********************************************************/
        /* View state                                              */
        /***********************************************************/


        ClaimVM.prototype.afterTabRender = function () {
            $('[data-toggle="tooltip"]').tooltip();
            $('#claimDocsTabLink').click();
        };

        ClaimVM.prototype.showTasksCollapsed = function () {
            $(window).resize(function () {
                if ($(window).width() < 768) {
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
                let dateA = new Date(Date.parse(a.dueDate));
                let dateB = new Date(Date.parse(b.dueDate));
                return dateA.getTime() - dateB.getTime();
            }

            function sortDesc(a, b) {
                let dateA = new Date(Date.parse(a.dueDate));
                let dateB = new Date(Date.parse(b.dueDate));
                return dateB.getTime() - dateA.getTime();
            }

            let tmpArray = this.claimEntries.removeAll();
            tmpArray.sort(this.sortDir() === 'desc' ? sortDesc : sortAsc);
            this.claimEntries(tmpArray);
        };

        ClaimVM.prototype.refreshClaimEntriesListing = function () {
            let claimId = this.claim()._id();
            console.log('Refresh entries list. ClaimId ' + claimId);
            this.loadEntriesForClaim(claimId);
        };

        ClaimVM.prototype.refreshFormsListing = function () {
            let claimId = this.claim()._id();
            console.log('Refresh forms list. ClaimId ' + claimId);
            this.loadFormsForClaim(claimId);
        };

        ClaimVM.prototype.niceName = function (contact) {
            let nice = contact.name() || '';
            return nice.length > 0 ? nice : 'None';
        };

        ClaimVM.prototype.setupDocsToList = function () {
            this.docsToList = ko.computed(function () {
                let allDocs = [];
                this.claim().attachments().forEach(attach => {
                    allDocs.push({origin: 'Claim', originId: this.claim()._id(), attachment: attach});
                });
                this.claimEntries().forEach(claimEntry => {
                    claimEntry.attachments.forEach(attach => {
                        if (!attach.hasOwnProperty('type')) {
                            attach.type = 'Unknown';
                        }
                        if (!attach.hasOwnProperty('lastModifiedDate')) {
                            attach.lastModifiedDate = new Date();
                        }
                        if (!attach.hasOwnProperty('owner')) {
                            attach.owner = claimEntry.owner;
                        }
                        allDocs.push({
                            origin: 'ClaimEntry',
                            originId: claimEntry._id,
                            attachment: KOMap.fromJS(attach)
                        });
                    });
                });
                return allDocs.sort((doc1, doc2) => {
                    function _getTime(doc) {
                        return doc.attachment.lastModifiedDate().getTime();
                    }

                    return (_getTime(doc2) - _getTime(doc1));
                });
            }, this);
        }

        /***********************************************************/
        /* Server calls                                            */
        /***********************************************************/

        ClaimVM.prototype.onClose = function (ignoreUnsubmittedBills) {
            console.log('Closing Claim: ' + KOMap.toJSON(this.claim));

            ajaxUtils.post(
                '/claim/close',
                KOMap.toJSON({claimId: this.claim()._id(), ignoreUnsubmittedBills: ignoreUnsubmittedBills}),
                function onSuccess(response) {
                    if (response.status == 'Success') {
                        this.claim().isClosed(true);
                        this.claim().dateClosed(new Date());

                        amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Updated Claim ' + this.claim().insuranceCompanyFileNum()});
                        amplify.publish(Events.SAVED_CLAIM, {'claim': KOMap.toJS(this.claim())});
                        console.log('Closed claim');

                        this.storeInSession(this.claim()._id(), KOMap.toJS(this.claim()));
                        this.inEditMode(false);
                    } else {
                        bootbox.dialog({
                            title: "Claim has an un-submitted bill",
                            message: "Close anyway?",
                            size: "small",
                            buttons: {
                                no: {label: "No", className: "btn-danger", callback: $.noop},
                                yes: {label: "Yes", className: "btn-info", callback: this.onClose.bind(this, true)}
                            }
                        });
                    }
                    ;
                }.bind(this));
        };

        ClaimVM.prototype.onSave = function () {
            console.log(`Saving Claim: ${KOMap.toJSON(this.claim)}`);

            ajaxUtils.post(
                '/claim',
                KOMap.toJSON(this.claim),
                function onSuccess(response) {
                    console.log('Saved claim');

                    // Update Ids gen. by the server
                    this.claim()._id(response.data._id);

                    let fileNum = this.claim().insuranceCompanyFileNum()
                        || this.claim().insuranceCompanyPolicyNum()
                        || this.claim().fileNum()
                        || this.claim()._id();

                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: `Updated Claim ${fileNum}`});
                    amplify.publish(Events.SAVED_CLAIM, {'claim': KOMap.toJS(this.claim())});

                    this.storeInSession(this.claim()._id(), KOMap.toJS(this.claim()));
                    this.inEditMode(false);
                    Audit.info('SavedClaim', {_id: this.claim()._id(), fileNum: this.claim().fileNum()});

                    // Reload
                    this.loadClaim(this.claim()._id());
                }.bind(this));
        };

        ClaimVM.prototype.loadClaim = function (claimId) {
            ajaxUtils.getJSON('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.claim);
                    this.storeInSession(claimId, resp.data);

                    // Update contacts
                    console.log('Updating contacts in session');
                    this.claim().contacts().forEach(contactInfo => {
                        ContactClient.updateInSession(KOMap.toJS(contactInfo.contact));
                    });
                    amplify.publish(Events.ADDED_CONTACT);

                    Audit.info('ViewClaim', {_id: this.claim()._id(), fileNum: this.claim().fileNum()});
                }.bind(this))
                .fail(err => {
                    Audit.error('ViewClaim', {_id: claimId, Details: err.responseText});
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while displaying claim'});
                });
        };

        ClaimVM.prototype.loadEntriesForClaim = function (claimId) {
            ajaxUtils.getJSON('/claim/' + claimId + '/entries')
                .done(function (resp) {
                    console.log('Loaded claim entries' + JSON.stringify(resp.data.length));
                    this.claimEntries(resp.data);
                    this.activeClaimEntryId(null);
                    this.sortEntries();
                }.bind(this));
        };

        ClaimVM.prototype.loadFormsForClaim = function (claimId) {
            ajaxUtils.getJSON('/claim/' + claimId + '/forms')
                .done(function (resp) {
                    console.log('Loaded claim forms. ClaimId: ' + JSON.stringify(resp.data.length));
                    this.claimForms(resp.data);
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

        ClaimVM.prototype.onPrintClaim = function () {
            // Populate the print template with AMD content
            $('#claim-print-template').html(printHtml);
            let container = document.createElement("div");
            let _this = this;

            // Render the print
            ko.renderTemplate(
                "claim-print-template",
                _this,
                {
                    afterRender: function print() {
                        console.log(container.innerHTML);

                        // Add frame
                        let frame = document.createElement('iframe');
                        document.body.appendChild(frame);

                        // Print
                        let frameContent = frame.contentWindow;
                        frameContent.document.open();
                        frameContent.document.write('<head><link rel=stylesheet href=../../css/app.css type=text/css ></head>');
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
            Audit.info('PrintClaim', {_id: _this.claim()._id()});
        }

        return {viewModel: ClaimVM, template: viewHtml};
    });