define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'app/utils/events'],
    function ($, ko, KOMap, amplify, Claim, Events) {

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;

            // Model
            this.claims = ko.observableArray([]);

            // View state
            this.isClaimPanelVisible = ko.observable(false);
            this.setupClaimsGrid();
            this.loadClaims();
        }

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
                            var evName = 'SHOW_CLAIM';
                            return "<a href='#' " +
                                "onClick='amplify.publish(\"SHOW_CLAIM\"," + data + ")'>" + data + "</a>";
                        },
                        "targets": 0
                    }
                ]
            });
        };

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
            var panelRef = $("#gridPanel");
            var panelContentRef = $("#gridPanelContent");

            if (panelRef.width() <= 30) {
                panelRef.velocity({ width: '78%' }, this.gridNavDelay);
                panelRef.toggleClass('gridPanelClosed');
                panelContentRef.velocity("fadeIn", { duration: this.gridNavDelay });
            } else {
                panelRef.velocity({ width: '30px' }, {duration: this.gridNavDelay}, 'ease-in-out');
                panelRef.toggleClass('gridPanelClosed');
                panelContentRef.velocity("fadeOut", { duration: this.gridNavDelay });
            }
        };

        AppVM.prototype.onAddNewClaim = function () {
            this.toggleGridPanel();
            this.isClaimPanelVisible(true);
            amplify.publish(Events.NEW_CLAIM);
        }


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
