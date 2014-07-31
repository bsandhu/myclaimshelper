define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'app/utils/events', 'app/utils/router'],
    function ($, ko, KOMap, amplify, Claim, Events, Router) {

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;

            // Model
            this.claims = ko.observableArray([]);

            // View state
            this.isClaimPanelVisible = ko.observable(false);
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
                this.isClaimPanelVisible(false);
                this.expandGridPanel();
            });
            amplify.subscribe(Events.SHOW_CLAIM, this, function (data) {
                console.log('AppVM - SHOW_CLAIM ev');
                this.isClaimPanelVisible(true);
                this.collapseGridPanel();
            });
            amplify.subscribe(Events.NEW_CLAIM, this, function (data) {
                console.log('AppVM - NEW_CLAIM ev');
                this.isClaimPanelVisible(true);
                this.collapseGridPanel();
            });
        };

        AppVM.prototype.onAddNewClaim = function () {
            this.isClaimPanelVisible(true);
            this.collapseGridPanel();
            Router.routeToNewClaim();
        }

        /*************************************************/
        /* Panels animation                              */
        /*************************************************/

        AppVM.prototype.toggleSearchPanel = function () {
            console.log('Search panel toggle');
            var panelRef = $('#searchPanel');
            var panelContentRef = $('#searchPanelContent');

            if (panelRef.width() <= 30) {
                panelRef.velocity({ width: '20%' }, this.gridNavDelay);
                panelContentRef.velocity("fadeIn", { duration: this.gridNavDelay });
            } else {
                panelRef.velocity({ width: '30px' }, {duration: this.gridNavDelay}, 'ease-in-out');
                panelContentRef.velocity("fadeOut", { duration: this.gridNavDelay });
            }
        };

        AppVM.prototype.toggleGridPanel = function () {
            console.log('Grid panel toggle');

            var panelRef = $("#gridPanel");
            var panelContentRef = $("#gridPanelContent");

            if (panelRef.width() <= 30) {
                this.expandGridPanel();
            } else {
                this.collapseGridPanel();
            }
        };

        AppVM.prototype.expandGridPanel = function () {
            console.log('Expand grid panel');

            var panelRef = $("#gridPanel");
            var panelContentRef = $("#gridPanelContent");

            panelRef.velocity({ width: '78%' }, this.gridNavDelay);
            panelRef.toggleClass('gridPanelClosed');
            panelContentRef.velocity("fadeIn", { duration: this.gridNavDelay });
        };

        AppVM.prototype.collapseGridPanel = function () {
            console.log('Collapse grid panel');

            var panelRef = $("#gridPanel");
            var panelContentRef = $("#gridPanelContent");

            panelRef.velocity({ width: '30px' }, {duration: this.gridNavDelay}, 'ease-in-out');
            panelRef.toggleClass('gridPanelClosed');
            panelContentRef.velocity("fadeOut", { duration: this.gridNavDelay });
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
                })
        };

        return AppVM;
    });
