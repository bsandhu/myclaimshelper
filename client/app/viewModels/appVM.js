define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'model/states', 'app/utils/events',
        'app/utils/router', 'app/utils/dateUtils', 'app/utils/ajaxUtils'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, States, Events, Router, DateUtils, AjaxUtils) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;
            this.DateUtils = DateUtils;

            this.showSummary = ko.observable(true);
            this.showClaimsList = ko.observable(false);

            // Model
            this.stateChoice = ko.observable();
            this.states = [
                {name: 'All', query: '{}'},
                {name: 'Active', query: '{"state":"open"}'},
                {name: 'On Hold', query: '{"state":"hold"}'},
                {name: 'Closed', query: '{"state":"closed"}'}
            ];

            // View state
            this.hideSearchPanelCollapsedLabel();
            this.setupEvListeners();
        }

        AppVM.prototype.startRouter = function () {
            // Hash tag based naviagtion - needed for SPAs
            Router.start();
        };

        AppVM.prototype.onHelpClick = function (claim) {
            window.open('/help/help.html', 'Agent help');
        };

        AppVM.prototype.onClaimsListViewClick = function () {
            this.showClaimsList(true);
            this.showSummary(false);
        };

        AppVM.prototype.onClaimsSummaryViewClick = function () {
            this.showClaimsList(false);
            this.showSummary(true);
        };

        /*************************************************/
        /* Search                                        */
        /*************************************************/

        AppVM.prototype.onStateSelect = function () {
            var _this = this;
            this.stateChoice.subscribe(
                function triggerSearch(selectedOption) {
                    console.log(selectedOption[0].query);
                    _this.searchClaims(selectedOption[0].query);
                });
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
            this.expandGridPanel();
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
        };

        AppVM.prototype.transitionToClaimEntry = function () {
            this.collapseGridPanel();
            this.partialCollapseClaimPanel();
            this.expandClaimEntryPanel();
        };

        AppVM.prototype.transitionToClaim = function () {
            this.collapseGridPanel();
            this.collapseClaimEntryPanel();
            this.expandClaimPanel();
        };

        AppVM.prototype.onAddNewClaim = function () {
            Router.routeToNewClaim();
        };

        /*************************************************/
        /* Panels animation                              */
        /*************************************************/

        AppVM.prototype.toggleSearchPanel = function () {
            console.log('Search panel toggle');
            if ($('#searchPanel').width() <= 30) {
                this.expandSearchPanel();
            } else {
                this.collapseSearchPanel();
            }
        };

        AppVM.prototype.showSearchPanelCollapsedLabel = function () {
            $('#searchPanelCollapsedContent').velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.hideSearchPanelCollapsedLabel = function () {
            $('#searchPanelCollapsedContent').hide();
        };

        AppVM.prototype.expandSearchPanel = function () {
            this.hideSearchPanelCollapsedLabel();
            $('#searchPanel').velocity({ width: '18%' }, this.gridNavDelay);
            $('#searchPanelContent').velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseSearchPanel = function () {
            this.showSearchPanelCollapsedLabel();
            $('#searchPanel').velocity({ width: '30px' }, {duration: this.gridNavDelay}, 'ease-in-out');
            $('#searchPanelContent').velocity("fadeOut", { duration: this.gridNavDelay });
        };

        // Grid panel

        AppVM.prototype.toggleGridPanel = function () {
            if (this.lessThat4PercentWide($("#gridPanel"))) {
                Router.routeToHome();
            } else {
                this.collapseGridPanel.bind(this);
            }
        };

        AppVM.prototype.expandGridPanel = function () {
            console.log('Expand grid panel');
            $("#gridPanel").velocity({ width: '100%' }, this.gridNavDelay);
            $("#gridPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
            $('#gridPanelCollapsedContent').hide();
        };

        AppVM.prototype.collapseGridPanel = function () {
            console.log('Collapse grid panel');
            $('#gridPanelCollapsedContent').velocity("fadeIn", { duration: this.gridNavDelay });
            $("#gridPanel").velocity({ width: '4%' }, {duration: this.gridNavDelay}, 'ease-in-out');
            $("#gridPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
        };

        // Claims panel

        AppVM.prototype.lessThat4PercentWide = function (elem) {
            return (elem.width() / elem.parent().width() * 100).toFixed(0) <= 4;
        };

        AppVM.prototype.toggleClaimPanel = function () {
            var navFn = this.lessThat4PercentWide($("#claimPanel")) ? this.expandClaimPanel.bind(this) : this.collapseClaimPanel.bind(this);
            navFn();
        };

        AppVM.prototype.expandClaimPanel = function () {
            $("#claimPanel").velocity({ width: '96%' }, this.gridNavDelay);
            $("#claimPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseClaimPanel = function () {
            $("#claimPanel").velocity({ width: '0%' }, {duration: this.gridNavDelay}, 'ease-in-out');
            $("#claimPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
        };

        AppVM.prototype.partialCollapseClaimPanel = function () {
            $("#claimPanel").velocity({ width: '30%' }, {duration: this.gridNavDelay}, 'ease-in-out');
        };

        // Claim Entry panel

        AppVM.prototype.toggleClaimEntryPanel = function () {
            var navFn = this.lessThat4PercentWide($("#claimEntryPanel")) ? this.expandClaimEntryPanel.bind(this) : this.collapseClaimEntryPanel.bind(this);
            navFn();
        };

        AppVM.prototype.expandClaimEntryPanel = function () {
            $("#claimEntryPanel").velocity({ 'width': '50%' }, this.gridNavDelay);
            $("#claimEntryPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseClaimEntryPanel = function () {
            $("#claimEntryPanel").velocity({ width: '0%' }, {duration: this.gridNavDelay}, 'ease-in-out');
            $("#claimEntryPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
        };

        return AppVM;
    });