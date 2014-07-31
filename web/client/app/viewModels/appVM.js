define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim'],
    function ($, ko, koMap, amplify, Claim) {

        function AppVM() {
            console.log('Init AppVM');
            this.gridNavDelay = 100;

            this.claims = ko.observableArray([]);
            this.claim = KOMap.fromJS(new Claim());

            this.load();

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

            this.setupEvListeners();
        }

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
            console.log('Adding new claim');
        }

        AppVM.prototype.setupEvListeners = function () {
            amplify.subscribe('SHOW_CLAIM', function(data){
                console.log('Display claimId: ' + data);
                this.toggleGridPanel();
            }.bind(this));
            //window.location.href = '/app/claims/claim.html?_id=new';
        }


        AppVM.prototype.loadClaim = function (claimId) {
            var _this = this;
            $.get('/claim/' + claimId)
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claim ' + JSON.stringify(data).substring(1, 25) + '...');

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

        AppVM.prototype.load = function () {
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
