define(['jquery', 'knockout', 'KOMap', 'amplify', 'app/model/claim'],
    function ($, ko, koMap, amplify, Claim) {

        function AppVM() {
            console.log('Init AppVM');
            this.claims = ko.observableArray([]);
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
                        // The `data` parameter refers to the data for the cell (defined by the
                        // `data` option, which defaults to the column being worked with, in
                        // this case `data: 0`.
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
                panelRef.velocity({ width: '20%' }, 250);
                panelContentRef.velocity("fadeIn", { duration: 250 });
            } else {
                panelRef.velocity({ width: '30px' }, {duration: 250}, 'ease-in-out');
                panelContentRef.velocity("fadeOut", { duration: 250 });

            }
        };

        AppVM.prototype.toggleGridPanel = function () {
            var panelRef = $("#gridPanel");
            var panelContentRef = $("#gridPanelContent");

            if (panelRef.width() <= 30) {
                panelRef.velocity({ width: '78%' }, 200);
                panelRef.toggleClass('gridPanelClosed');
                panelContentRef.velocity("fadeIn", { duration: 200 });
            } else {
                panelRef.velocity({ width: '30px' }, {duration: 200}, 'ease-in-out');
                panelRef.toggleClass('gridPanelClosed');
                panelContentRef.velocity("fadeOut", { duration: 200 });
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


        AppVM.prototype.load = function () {
            var _this = this;
            $.get('/claim')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claim ' + JSON.stringify(data));
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
