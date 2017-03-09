define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/session',
        'app/utils/responsive', 'app/utils/tours', 'app/utils/consts'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils, Session,
              Responsive, Tours, Consts) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');
            this.Session = Session;
            this.Responsive = Responsive;

            // UI state
            this.gridNavDelay = 0;
            this.gridNavEffect = 'easeOut';
            this.claimPanelState = undefined;
            this.claimEntryPanelState = undefined;
            this.unreadMsgCount = ko.observable(0);
            this.showApp = ko.observable(false);
            this.userName = ko.observable('');

            //Lazy load
            this.loadTravel = ko.observable(false);
            this.loadContacts = ko.observable(false);
            this.loadClaimsList = ko.observable(false);

            // Profile based access
            this.isBillingEnabled = ko.observable(false);

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
            this.setupUserLink();
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
                this.loadTravel(true);
                this.transitionToTravel();
            });
            amplify.subscribe(Events.SHOW_CONTACTS, this, function () {
                console.log('AppVM - SHOW_CONTACTS ev');
                this.loadContacts(true);
                this.transitionToContacts();
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
                this.loadClaimsList(true);
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
            amplify.subscribe(Events.CREATE_NEW_BILL, this, function () {
                console.log('AppVM - CREATE_NEW_BILL ev');
                this.transitionToBilling(this);
            });
            amplify.subscribe(Events.CREATE_NEW_FORM, this, function () {
                console.log('AppVM - CREATE_NEW_FORM ev');
                this.transitionToForm(this);
            });
            amplify.subscribe(Events.SHOW_CLAIM_FORM, this, function () {
                console.log('AppVM - SHOW_CLAIM_FORM ev');
                this.transitionToForm(this);
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
            amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                this.isBillingEnabled(Session.getCurrentUserProfile().isBillingEnabled);
            });
            amplify.subscribe(Events.LOGGED_IN, this, function () {
                console.log('AppVM - LOGGED_IN ev');
                this.showApp(true);
                this.userName(Session.getCurrentUserId());
                this.startRouter();
            });
            amplify.subscribe(Events.LOGOFF, this, function () {
                console.log('AppVM - LOGOFF ev');
                this.showApp(false);
                this.userName('');
                location.reload();
            });
            amplify.subscribe(Events.SHOW_WELCOME_MSG, this, function () {
                console.log('AppVM - SHOW_WELCOME_MSG ev');
                if (!Responsive.onXSDevice()) {
                    $('#welcomeModal').modal();
                }
            });
        };

        AppVM.prototype.setupUserLink = function () {
            var _this = this;

            this.userNameLinkText = ko.computed(function () {
                var name = _this.userName() || 'Login';
                /*return (name.length >= 7)
                 ? name.substr(0, 7) + '..'
                 : name;*/
                return name;
            });
        }

        AppVM.prototype.onUserNameLinkClick = function () {
            if (this.userName()) {
                this.router.showProfilePopup();
            } else {
                this.onLogin();
            }
        }

        AppVM.prototype.onShowHelp = function (vm, ev) {
            var timer = undefined;
            var slideoutMenu = $('.slideout-menu');

            slideoutMenu.css('left', ev.clientX - slideoutMenu.width() / 2);

            // Toggle open class
            slideoutMenu.toggleClass("open");
            if (timer) {
                clearTimeout(timer);
            }

            // Slide menu
            if (slideoutMenu.hasClass("open")) {
                slideoutMenu.removeClass("hide");
                slideoutMenu.animate({
                    height: "200px"
                });
            } else {
                slideoutMenu.animate({
                    height: "0px"
                }, 250, function () {
                    slideoutMenu.addClass("hide");
                    slideoutMenu.removeClass("open");
                });
            }
            // Hide after a bit, if still open
            timer = setTimeout(function () {
                if (slideoutMenu.hasClass("open")) {
                    slideoutMenu.animate({
                        height: "0px"
                    }, 250, function () {
                        slideoutMenu.addClass("hide");
                        slideoutMenu.removeClass("open");
                    });
                }
            }, 5000);
        }

        AppVM.prototype.onWelcomeAccept = function (vm, ev) {
            Router.routeToHome();
            Tours.startClaimsTour();
        }

        AppVM.prototype.onWelcomeDontShow = function () {
            Tours.markAsDone();
        }

        AppVM.prototype.onStartTravelTour = function (vm, ev) {
        }

        AppVM.prototype.onStartBillingTour = function (vm, ev) {
            Router.routeToBilling();
            $('.slideout-menu').toggleClass('hide');
            $('.slideout-menu').toggleClass('open');
            Tours.startBillingTour();
        }

        AppVM.prototype.onStartClaimsTour = function (vm, ev) {
            Router.routeToHome();
            $('.slideout-menu').toggleClass('hide');
            $('.slideout-menu').toggleClass('open');
            Tours.startClaimsTour();
        }

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
            this.collapseClaimFormPanel();
            this.collapseClaimsListPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
            this.expandDashboardPanel();
        };

        AppVM.prototype.transitionToTravel = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimFormPanel();
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
            this.expandTravelPanel();
        };

        AppVM.prototype.transitionToContacts = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimFormPanel();
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseBillingPanel();
            this.collapseTravelPanel();
            this.expandContactsPanel();
        };

        AppVM.prototype.transitionToBilling = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimFormPanel();
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseContactsPanel();
            this.expandBillingPanel();
        };

        AppVM.prototype.transitionToClaimsList = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimFormPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
            this.expandClaimsListPanel();
        };

        AppVM.prototype.transitionToClaimEntry = function () {
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
            this.collapseClaimFormPanel();
            if (Responsive.onXSDevice()) {
                this.collapseClaimPanel();
                this.expandClaimEntryPanel();
            } else {
                this.partiallyCollapseClaimPanel();
                this.partiallyExpandClaimEntryPanel();
            }
        };

        AppVM.prototype.transitionToForm = function () {
            this.collapseClaimsListPanel();
            this.collapseClaimEntryPanel();
            this.collapseDashboardPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
            if (Responsive.onXSDevice()) {
                this.collapseClaimPanel();
                this.expandClaimFormPanel();
            } else {
                this.partiallyCollapseClaimPanel();
                this.partiallyExpandClaimFormPanel();
            }
        };

        AppVM.prototype.transitionToClaim = function () {
            this.collapseClaimsListPanel();
            this.collapseDashboardPanel();
            this.collapseClaimEntryPanel();
            this.collapseClaimFormPanel();
            this.collapseTravelPanel();
            this.collapseBillingPanel();
            this.collapseContactsPanel();
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

        // **** Expand ****

        AppVM.prototype.expandDashboardPanel = function () {
            this._expandPanel('dashboardPanel');
        }

        AppVM.prototype.expandTravelPanel = function () {
            this._expandPanel('travelPanel');
        }

        AppVM.prototype.expandContactsPanel = function () {
            this._expandPanel('contactsPanel');
        }

        AppVM.prototype.expandBillingPanel = function () {
            this._expandPanel('billingPanel');
        }

        AppVM.prototype.expandClaimsListPanel = function () {
            this._expandPanel('claimsListPanel');
        }

        AppVM.prototype.expandClaimFormPanel = function () {
            this._expandPanel('claimFormPanel');
        }

        AppVM.prototype.expandClaimEntryPanel = function () {
            this._expandPanel('claimEntryPanel');
        }

        AppVM.prototype._expandPanel = function (panelId) {
            let panelSelector = '#' + panelId;
            let stateTracker = panelId + 'State';

            if (this[stateTracker] !== 'expanded') {
                $(panelSelector).width('100%');
                $(panelSelector).show();
                $(panelSelector+ "Content").velocity("fadeIn", {duration: this.gridNavDelay});
                this[stateTracker] = 'expanded';
            }
        };

        // **** Collapse ****

        AppVM.prototype.collapseDashboardPanel = function () {
            this._collapsePanel('dashboardPanel');
        }

        AppVM.prototype.collapseTravelPanel = function () {
            this._collapsePanel('travelPanel');
        }

        AppVM.prototype.collapseContactsPanel = function () {
            this._collapsePanel('contactsPanel');
        }

        AppVM.prototype.collapseBillingPanel = function () {
            this._collapsePanel('billingPanel');
        }

        AppVM.prototype.collapseClaimsListPanel = function () {
            this._collapsePanel('claimsListPanel');
        }

        AppVM.prototype.collapseClaimFormPanel = function () {
            this._collapsePanel('claimFormPanel');
        }

        AppVM.prototype.collapseClaimEntryPanel = function () {
            this._collapsePanel('claimEntryPanel');
        }

        AppVM.prototype._collapsePanel = function (panelId) {
            let panelSelector = '#' + panelId;
            let stateTracker = panelId + 'State';

            if (this[stateTracker] !== 'collapsed') {
                $(panelSelector).hide();
                this[stateTracker] = 'collapsed';
            }
        };

        // Claim panel

        AppVM.prototype.expandClaimPanel = function () {
            if (this.claimPanelState !== 'expanded') {
                $("#claimPanel").width("100%");
                $("#claimPanel").show();
                this.claimPanelState = 'expanded';
                amplify.publish(Events.EXPAND_CLAIM_PANEL);
            }
        };

        AppVM.prototype.collapseClaimPanel = function () {
            if (this.claimPanelState !== 'collapsed') {
                $("#claimPanel").hide();

                this.claimPanelState = 'collapsed';
                amplify.publish(Events.COLLAPSE_CLAIM_PANEL);
            }
        };

        AppVM.prototype.partiallyCollapseClaimPanel = function () {
            if (this.claimPanelState !== 'partiallyCollapsed') {
                $("#claimPanel").show();
                $("#claimPanel").width("29%");

                $("#claimPanelContent").show();
                this.claimPanelState = 'partiallyCollapsed';
                amplify.publish(Events.PARTIALLY_COLlAPSE_CLAIM_PANEL);
            }
        };

        // **** Partial expand ****

        AppVM.prototype.partiallyExpandClaimEntryPanel = function () {
            this._partiallyExpandPanel('claimEntryPanel');
        };

        AppVM.prototype.partiallyExpandClaimFormPanel = function () {
            this._partiallyExpandPanel('claimFormPanel');
        };

        AppVM.prototype._partiallyExpandPanel = function (panelId) {
            if (this[panelId + 'State'] !== 'expanded') {
                $("#" + panelId).width('70%');
                $("#" + panelId).show();
                $("#" + panelId + "Content").velocity("fadeIn", {duration: this.gridNavDelay});

                this[panelId + 'State'] = 'expanded';
            }
        };

        return AppVM;
    }
);
