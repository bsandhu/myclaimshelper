define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'app/utils/events', 'app/utils/router'],
    function ($, ko, KOMap, amplify, Claim, Events, Router) {
        'use strict';

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;

            // Model
            this.claims = ko.observableArray([]);

            // View state
            this.setupEvListeners();
            this.setupClaimsGrid();
            this.loadClaims();
        }

        /*************************************************/
        /* View state                                    */
        /*************************************************/

        AppVM.prototype.setupClaimsGrid = function () {
            this.tableConfig = ko.observable({
                "paging": true,
                "ordering": true,
                "info": true,
                "columns": [
                    { "title": "Id" },
                    { "title": "Description" }
                ],
                "columnDefs": [
                    {
                        // The `data` parameter refers to the data for the cell
                        // Publish an Amplify Ev on click
                        "render": function (data, type, row) {
                            return "<a href='#/claim/" + data + "''>" + data + "</a>";
                        },
                        "targets": 0
                    }
                ]
            });
        };

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

        AppVM.prototype.transitionToSearchResults = function() {
            this.expandGridPanel();
            this.collapseClaimPanel();
            this.collapseClaimEntryPanel();
        };

        AppVM.prototype.transitionToClaimEntry = function() {
            this.collapseGridPanel();
            this.partialCollapseClaimPanel();
            this.expandClaimEntryPanel();
        }

        AppVM.prototype.transitionToClaim = function() {
            this.collapseGridPanel();
            this.collapseClaimEntryPanel();
            this.expandClaimPanel();
        }


        AppVM.prototype.onAddNewClaim = function () {
            Router.routeToNewClaim();
        };

        /*************************************************/
        /* Panels animation                              */
        /*************************************************/

        AppVM.prototype.toggleSearchPanel = function () {
            console.log('Search panel toggle');
            var panelRef = $('#searchPanel');
            var panelContentRef = $('#searchPanelContent');

            if (panelRef.width() <= 30) {
                panelRef.velocity({ width: '18%' }, this.gridNavDelay);
                panelContentRef.velocity("fadeIn", { duration: this.gridNavDelay });
            } else {
                panelRef.velocity({ width: '30px' }, {duration: this.gridNavDelay}, 'ease-in-out');
                panelContentRef.velocity("fadeOut", { duration: this.gridNavDelay });
            }
        };

        // Grid panel

        AppVM.prototype.toggleGridPanel = function () {
            var navFn = this.lessThat4PercentWide($("#gridPanel")) ? this.transitionToSearchResults.bind(this) : this.collapseGridPanel.bind(this);
            navFn();
        };

        AppVM.prototype.expandGridPanel = function () {
            console.log('Expand grid panel');
            $("#gridPanel").velocity({ width: '80%' }, this.gridNavDelay);
            $("#gridPanelContent").velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseGridPanel = function () {
            console.log('Collapse grid panel');
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
            $("#claimPanel").velocity({ width: '35%' }, {duration: this.gridNavDelay}, 'ease-in-out');
            //$("#claimPanelContent").velocity("fadeOut", { duration: this.gridNavDelay });
        };

        // Claim Entry panel

        AppVM.prototype.toggleClaimEntryPanel = function () {
            var navFn = this.lessThat4PercentWide($("#claimEntryPanel")) ? this.expandClaimEntryPanel.bind(this) : this.collapseClaimEntryPanel.bind(this);
            navFn();
        };

        AppVM.prototype.expandClaimEntryPanel = function () {
            $("#claimEntryPanel").velocity({ width: '90%' }, this.gridNavDelay);
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
                        tempArray.push([claim._id, claim.description]);
                    });
                    _this.claims(tempArray);
                })
                .fail(function () {
                    console.log('Fail');
                });
        };

        return AppVM;
    });