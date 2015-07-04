define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');

            // UI state
            this.gridNavDelay = 100;
            this.gridNavEffect = 'easeOut';
            this.claimPanelState = undefined;
            this.claimEntryPanelState = undefined;

            // Model
            this.stateChoice = ko.observable();
            this.states = [
                {name: 'All', query: '{}'},
                {name: 'Active', query: '{"state":"open"}'},
                {name: 'On Hold', query: '{"state":"hold"}'},
                {name: 'Closed', query: '{"state":"closed"}'}
            ];

            // View state
            this.setupEvListeners();
        }

        AppVM.prototype.startRouter = function () {
            // Hash tag based naviagtion - needed for SPAs
            Router.start();
        };

        AppVM.prototype.onHelpClick = function (claim) {
            window.open('/help/help.html', 'Agent help');
        };

        AppVM.prototype.onUserProfileClick = function () {
            amplify.publish(Events.SHOW_USER_PROFILE);
        };

        /*************************************************/
        /* View state                                    */
        /*************************************************/

        AppVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIMS_GRID, this, function () {
                console.log('AppVM - SHOW_CLAIMS_GRID ev');
                this.transitionToSearchResults();
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
        };

        AppVM.prototype.transitionToSearchResults = function () {
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.expandDashboardPanel();
        };

        AppVM.prototype.transitionToClaimEntry = function () {
            this.collapseDashboardPanel();
            this.partiallyCollapseClaimPanel();
            this.expandClaimEntryPanel();
        };

        AppVM.prototype.transitionToClaim = function () {
            this.collapseDashboardPanel();
            this.collapseClaimEntryPanel();
            this.expandClaimPanel();
        };

        AppVM.prototype.onAddNewClaim = function () {
            Router.routeToNewClaim();
        };

        /*************************************************/
        /* Panels animation                              */
        /*************************************************/

        // Dashboard panel

        AppVM.prototype.lessThat3PercentWide = function (elem) {
            return (elem.width() / elem.parent().width() * 100).toFixed(0) <= 3;
        };

        AppVM.prototype.toggledashboardPanel = function () {
            if (this.lessThat3PercentWide($("#dashboardPanel"))) {
                Router.routeToHome();
            } else {
                this.collapseDashboardPanel.bind(this);
            }
        };

        AppVM.prototype.expandDashboardPanel = function () {
            if (this.searchPanelState !== 'expanded') {
                $("#dashboardPanel").velocity(
                    { width: '100%'},
                    {begin: function () { $("#dashboardPanel").show(); }},
                    this.gridNavDelay);
                $('#dashboardPanelCollapsedContent').hide();
                this.searchPanelState = 'expanded';
            }
        };

        AppVM.prototype.collapseDashboardPanel = function () {
            if (this.searchPanelState !== 'collapsed') {
                $("#dashboardPanel").velocity(
                    { width: '0%'},
                    {duration: this.gridNavDelay/100,
                    complete: function () {$("#dashboardPanel").hide(); }},
                    this.gridNavEffect);
                this.searchPanelState = 'collapsed';
            }
        };

        // Claim panel

        AppVM.prototype.expandClaimPanel = function () {
            if (this.claimPanelState !== 'expanded') {
                $("#claimPanel").velocity(
                    { width: '96%'},
                    {begin: function () { $("#claimPanel").show(); }},
                    this.gridNavDelay);
                this.claimPanelState = 'expanded';
                amplify.publish(Events.EXPAND_CLAIM_PANEL);
            }
        };

        AppVM.prototype.collapseClaimPanel = function () {
            if (this.claimPanelState !== 'collapsed') {
                $("#claimPanel").velocity(
                    { width: '0%'},
                    {duration: this.gridNavDelay/100,
                     complete: function () { $("#claimPanel").hide(); }},
                    this.gridNavEffect);
                this.claimPanelState = 'collapsed';
                amplify.publish(Events.COLLAPSE_CLAIM_PANEL);
            }
        };

        AppVM.prototype.partiallyCollapseClaimPanel = function () {
            if (this.claimPanelState !== 'partiallyCollapsed') {
                $("#claimPanel").velocity({ width: '28%' }, {duration: this.gridNavDelay}, this.gridNavEffect);
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

        AppVM.prototype.resetWidgets = function () {
            $.SmartMessageBox({
                title: "<i class='fa fa-refresh' style='color:green'></i> Clear Local Storage",
                content: $.widresetMSG || "Would you like to RESET all your saved widgets and clear LocalStorage?",
                buttons: '[No][Yes]'
            }, function (ButtonPressed) {
                if (ButtonPressed == "Yes" && localStorage) {
                    localStorage.clear();
                    location.reload();
                }

            });
        }

        return AppVM;
    }
);