define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'app/utils/events', 'app/utils/router'],
    function ($, ko, KOMap, amplify, Claim, Events, Router) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;

            // Model
            this.claims = ko.observableArray([]);
            this.searchResults = ko.observableArray([]);
            this.searchText = ko.observable('');

            // View state
            this.hideSearchPanelCollapsedLabel();
            this.setupEvListeners();
            this.setupSearchListeners();
        }

        AppVM.prototype.startRouter = function () {
            // Hash tag based naviagtion - needed for SPAs
            Router.start();
        };

        AppVM.prototype.onClaimSelect = function (claim) {
            Router.routeToClaim(claim._id());
        };

        AppVM.prototype.onHelpClick = function (claim) {
            window.open('/help/help.html', 'Agent help');
        };

        AppVM.prototype.onSearchClear = function () {
            var temp = [];
            $.each(this.claims(), function (index, claim) {
                temp.push(claim);
            });
            this.searchResults(temp);
            this.searchText('');
        };

        AppVM.prototype.setupSearchListeners = function () {
            this.searchText.subscribe(onSearchTxtUpdate);
            var _this = this;

            function onSearchTxtUpdate(txt) {
                var localMatches = [];
                console.log('Search... ' + txt);
                if (!txt || txt.length < 3) {
                    return;
                }
                $.each(_this.claims(),
                    function filterBySearchText(index, claim) {
                        var desc = claim.description() || '';
                        if (desc.toUpperCase().search(_this.searchText().toUpperCase()) >= 0) {
                            localMatches.push(claim);
                        }
                    }
                );
                _this.searchResults(localMatches);
            }
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
        };

        AppVM.prototype.transitionToSearchResults = function () {
            this.expandGridPanel();
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
            this.loadClaims();
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
            $("#gridPanel").velocity({ width: '80%' }, this.gridNavDelay);
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
            $("#claimPanel").velocity({ width: '70%' }, this.gridNavDelay);
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
            $("#claimEntryPanel").velocity({ width: '55%' }, this.gridNavDelay);
            $("#claimEntryPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseClaimEntryPanel = function () {
            $("#claimEntryPanel").velocity({ width: '0%' }, {duration: this.gridNavDelay}, 'ease-in-out');
            $("#claimEntryPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
        };

        /*************************************************/
        /* Server calls                                  */
        /*************************************************/

        AppVM.prototype.loadClaims = function () {
            var _this = this;
            $.get('/claim')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claims ' + JSON.stringify(data).substring(1, 25) + '...');

                    var tempArray = [];
                    $.each(data, function (index, claim) {
                        var koClaim = KOMap.fromJS(claim, {}, new Claim());
                        tempArray.push(koClaim);
                    });
                    _this.claims(tempArray);
                    _this.searchResults(tempArray);
                })
                .fail(function () {
                    console.log('Fail');
                });
        };

        return AppVM;
    });