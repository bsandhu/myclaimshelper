define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/session'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils, Session) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');
            this.Session = Session;

            // UI state
            this.gridNavDelay = 100;
            this.gridNavEffect = 'easeOut';
            this.claimPanelState = undefined;
            this.claimEntryPanelState = undefined;
            this.unreadMsgCount = ko.observable(0);
            this.showApp = ko.observable(false);
            this.userName = ko.observable('');

            // Model
            this.stateChoice = ko.observable();
            this.states = [
                {name: 'All', query: '{}'},
                {name: 'Active', query: '{"state":"open"}'},
                {name: 'On Hold', query: '{"state":"hold"}'},
                {name: 'Closed', query: '{"state":"closed"}'}
            ];

            // View state
            this.router = Router;
            this.setupEvListeners();

            $(window).on('hashchange', this.setNavBarHighlight);
            this.setNavBarHighlight();
        }

        AppVM.prototype.startRouter = function () {
            // Hash tag based naviagtion - needed for SPAs
            Router.start();
        };

        AppVM.prototype.locationStartsWith = function (loc) {
            return window.location.hash.startsWith(loc);
        };

        /*************************************************/
        /* View state                                    */
        /*************************************************/

        AppVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_DASHBOARD, this, function () {
                console.log('AppVM - SHOW_DASHBOARD ev');
                this.transitionToDashboard();
            });
            amplify.subscribe(Events.SHOW_TRAVEL, this, function () {
                console.log('AppVM - SHOW_TRAVEL ev');
                this.transitionToTravel();
            });
            amplify.subscribe(Events.SHOW_BILLING, this, function () {
                console.log('AppVM - SHOW_BILLING ev');
                this.transitionToBilling();
            });
            amplify.subscribe(Events.SHOW_BILLING_HISTORY, this, function () {
                console.log('AppVM - SHOW_BILLING_HISTORY ev');
                this.transitionToBilling();
            });
            amplify.subscribe(Events.SHOW_BILL, this, function () {
                console.log('AppVM - SHOW_BILL ev');
                this.transitionToBilling();
            });
            amplify.subscribe(Events.SHOW_CLAIMS_LIST, this, function () {
                console.log('AppVM - SHOW_CLAIMS_LIST ev');
                this.transitionToClaimsList();
            });
            amplify.subscribe(Events.SHOW_CLAIM, this, function () {
                console.log('AppVM - SHOW_CLAIM ev');
                this.transitionToClaim();
            });
            amplify.subscribe(Events.NEW_CLAIM, this, function () {
                console.log('AppVM - NEW_CLAIM ev');
                this.transitionToClaim(this);
            });
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, function () {
                console.log('AppVM - SHOW_CLAIM_ENTRY ev');
                this.transitionToClaimEntry(this);
            });
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, function () {
                console.log('AppVM - NEW_CLAIM_ENTRY ev');
                this.transitionToClaimEntry(this);
            });
            amplify.subscribe(Events.FAILURE_NOTIFICATION, this, function () {
                console.log('AppVM - FAILURE_NOTIFICATION ev');
            });
            amplify.subscribe(Events.SUCCESS_NOTIFICATION, this, function () {
                console.log('AppVM - SUCCESS_NOTIFICATION ev');
            });
            amplify.subscribe(Events.UPDATE_UNREAD_MSGS_COUNT, this, function (count) {
                console.log('AppVM - UPDATE_UNREAD_MSGS_COUNT ev');
                this.unreadMsgCount(count);
            });
            amplify.subscribe(Events.LOGIN, this, function (count) {
                console.log('AppVM - LOGIN ev');
                this.showApp(true);
                this.userName(Session.getCurrentUserId());
                this.startRouter();
            });
            amplify.subscribe(Events.LOGOFF, this, function (count) {
                console.log('AppVM - LOGIN ev');
                this.showApp(false);
                this.userName('');
                location.reload();
            });
        };

        AppVM.prototype.setNavBarHighlight = function () {
            var toolbarLinks = '.navbar-default .navbar-nav > li > a';
            $(toolbarLinks).each(function (index, link) {
                if (link.href === window.location.href) {
                    $(link).addClass('navbar-selected');
                } else {
                    $(link).removeClass('navbar-selected');
                }
            })
        }

        AppVM.prototype.transitionToDashboard = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimsListPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.expandDashboardPanel();
        };

        AppVM.prototype.transitionToTravel = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseBillingPanel();
            this.expandTravelPanel();
        };

        AppVM.prototype.transitionToBilling = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.expandBillingPanel();
        };

        AppVM.prototype.transitionToClaimsList = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.expandClaimsListPanel();
        };

        AppVM.prototype.transitionToClaimEntry = function () {
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.partiallyCollapseClaimPanel();
            this.expandClaimEntryPanel();
        };

        AppVM.prototype.transitionToClaim = function () {
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseClaimEntryPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.expandClaimPanel();
        };

        AppVM.prototype.onAddNewClaim = function () {
            Router.routeToNewClaim();
        };

        AppVM.prototype.onLogin = function () {
            amplify.publish(Events.SHOW_LOGIN);
        };

        /*************************************************/
        /* Panels animation                              */
        /*************************************************/

        // Expand

        AppVM.prototype.expandDashboardPanel = function () {
            this._expandPanel('dashboardPanel');
        }

        AppVM.prototype.expandTravelPanel = function () {
            this._expandPanel('travelPanel');
        }

        AppVM.prototype.expandBillingPanel = function () {
            this._expandPanel('billingPanel');
        }

        AppVM.prototype.expandClaimsListPanel = function () {
            this._expandPanel('claimsListPanel');
        }

        AppVM.prototype._expandPanel = function (panelId) {
            var panelSelector = '#' + panelId;
            var stateTracker = panelId + 'State';

            if (this[stateTracker] !== 'expanded') {
                $(panelSelector).velocity(
                    { width: '100%'},
                    {begin: function () {
                        $(panelSelector).show();
                    }},
                    this.gridNavDelay);
                this[stateTracker] = 'expanded';
            }
        };

        // Collapse

        AppVM.prototype.collapseDashboardPanel = function () {
            this._collapsePanel('dashboardPanel');
        }

        AppVM.prototype.collapseTravelPanel = function () {
            this._collapsePanel('travelPanel');
        }

        AppVM.prototype.collapseBillingPanel = function () {
            this._collapsePanel('billingPanel');
        }

        AppVM.prototype.collapseClaimsListPanel = function () {
            this._collapsePanel('claimsListPanel');
        }

        AppVM.prototype._collapsePanel = function (panelId) {
            var panelSelector = '#' + panelId;
            var stateTracker = panelId + 'State';

            if (this[stateTracker] !== 'collapsed') {
                $(panelSelector).velocity(
                    { width: '0%'},
                    {duration: this.gridNavDelay / 100,
                        complete: function () {
                            $(panelSelector).hide();
                        }},
                    this.gridNavEffect);
                this[stateTracker] = 'collapsed';
            }
        };

        // Claim panel

        AppVM.prototype.expandClaimPanel = function () {
            if (this.claimPanelState !== 'expanded') {
                $("#claimPanel").velocity(
                    { width: '96%'},
                    {begin: function () {
                        $("#claimPanel").show();
                    }},
                    this.gridNavDelay);
                this.claimPanelState = 'expanded';
                amplify.publish(Events.EXPAND_CLAIM_PANEL);
            }
        };

        AppVM.prototype.collapseClaimPanel = function () {
            if (this.claimPanelState !== 'collapsed') {
                $("#claimPanel").velocity(
                    { width: '0%'},
                    {duration: this.gridNavDelay / 100,
                        complete: function () {
                            $("#claimPanel").hide();
                        }},
                    this.gridNavEffect);
                this.claimPanelState = 'collapsed';
                amplify.publish(Events.COLLAPSE_CLAIM_PANEL);
            }
        };

        AppVM.prototype.partiallyCollapseClaimPanel = function () {
            if (this.claimPanelState !== 'partiallyCollapsed') {
                $("#claimPanel").velocity(
                    { width: '28%' },
                    {begin: function () {
                        $("#claimPanel").show();
                    }},
                    {duration: this.gridNavDelay}, this.gridNavEffect);
                $("#claimPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
                this.claimPanelState = 'partiallyCollapsed';
                amplify.publish(Events.PARTIALLY_COLlAPSE_CLAIM_PANEL);
            }
        };

        // Claim Entry panel

        AppVM.prototype.expandClaimEntryPanel = function () {
            if (this.claimEntryPanelState !== 'expanded') {
                $("#claimEntryPanel").velocity({ 'width': '70%' }, this.gridNavDelay);
                $("#claimEntryPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
                this.claimEntryPanelState = 'expanded';
            }
        };

        AppVM.prototype.collapseClaimEntryPanel = function () {
            if (this.claimEntryPanelState !== 'collapsed') {
                $("#claimEntryPanel").velocity({ width: '0%' }, {duration: this.gridNavDelay}, this.gridNavEffect);
                $("#claimEntryPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
                this.claimEntryPanelState = 'collapsed';
            }
        };

        return AppVM;
    }
);
