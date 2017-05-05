define(['jquery', 'underscore', 'knockout', 'KOMap', 'amplify',
        'app/utils/events', 'shared/NumberUtils', 'app/utils/ajaxUtils', 'app/utils/session',
        'text!app/components/stats/stats.tmpl.html', 'chart.js'],
    function ($, _, ko, KOMap, amplify, Events, NumberUtils, AjaxUtils, Session, statsView, Chart) {

        var N = Number;

        function StatsVM() {
            console.log('Init Stats');
            this.loadStats();
            this.isBillingEnabled = ko.observable();
            this.stats = ko.observable();
            this.NumberUtils = NumberUtils;


            //  **** Tasks stats ****
            this.tasksDoneToday = ko.computed(function () {
                return this.nullSafeStats("['TasksDoneToday'][0]['total']");
            }, this);
            this.tasksDueToday = ko.computed(function () {
                return this.nullSafeStats("['TasksDueToday'][0]['total']");
            }, this);
            this.percentTasksDone = ko.computed(function () {
                return N(this.tasksDueToday()) > 0
                    ? Math.round((N(this.tasksDoneToday()) / N(this.tasksDueToday())) * 100)
                    : 100;
            }, this);
            // Convert from
            //  [ { "_id" : [ "visit" ], "total" : 2 }, { "_id" : [ "other" ], "total" : 4 }, { "_id" : [ "phone" ], "total" : 5 } ];
            // to
            //  {visit: 2, other: 4, phone: 5}
            this.tasksByCategory = ko.computed(function () {
                return this.stats()
                    ? _.zip(
                    _.map(this.stats()['TaskByCategory'], function (i) {
                        return i._id[0]
                    }),
                    _.map(this.stats()['TaskByCategory'], function (i) {
                        return i.total
                    }))
                    : ''
            }, this);


            // **** Billing ****
            // Example - "BillsByBillingStatus":[{"_id":"Submitted","total":16.24}]}
            this.billByBillingStatus = ko.computed(function () {
                var result = {'Submitted': 0, 'Paid': 0, 'Not Submitted': 0};
                if (this.stats()) {
                    _.each(
                        this.stats()['BillsByBillingStatus'],
                        function (val) {
                            result[val._id] = val.total;
                        });
                }
                return result;
            }, this);


            //  **** Claims ****
            this.openClaimsCount = ko.computed(function () {
                return this.nullSafeStats("['OpenClaims'][0]['total']");
            }, this);
            this.closedClaimsData = ko.computed(function () {
                return this.nullSafeStats("['ClosedClaims']");
            }, this);
            this.showClosedClaimsChart = ko.computed(function () {
                return !_.isEmpty(this.closedClaimsData());
            }, this);

            this.setupEvListeners();
        }

        StatsVM.prototype.nullSafeStats = function (fn) {
            try {
                return this.stats()
                    ? eval('this.stats()' + fn)
                    : 0;
            } catch (e) {
                return 0;
            }
        }

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        StatsVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SAVED_CLAIM, this, this.loadStats);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.loadStats);
            amplify.subscribe(Events.SAVED_BILL, this, this.loadStats);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.onTasksStatsTemplRender);
            amplify.subscribe(Events.LOADED_USER_PROFILE, this, function () {
                this.isBillingEnabled(Session.getCurrentUserProfile().isBillingEnabled);
            });
        }

        StatsVM.prototype.onTasksStatsTemplRender = function () {
            console.log('Rendering task Stats');
            $('#tasksStatsCircliful').empty().removeData();

            $('#tasksStatsCircliful')
                .data('dimension', 90)
                .data('width', 10)
                .data('fontsize', 14)
                .data('fgcolor', '#039cdb')
                .data('bgcolor', '#bababa')
                .data('percent', this.percentTasksDone())
                .data('text', this.tasksDueToday() + ' Due')
                .data('info', this.tasksDoneToday() + ' Done')
                .circliful();
        }

        StatsVM.prototype.onclosedClaimsStatsTemplRender = function () {
            console.log('Rendering closed claims Stats');
            // Destroy on re-render
            // $('#closedClaimsChart').remove(); // this is my <canvas> element
            // $('#closedClaimsChartDiv').append('<canvas id="closedClaimsChart"></canvas>');

            let ctx = $("#closedClaimsChart");
            let labels = _.keys(this.closedClaimsData());
            let dataPoints = _.values(this.closedClaimsData());
            let myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Closed',
                            data: dataPoints
                        }
                    ]
                },
                options: {
                    legend: {display: false},
                    responsive: true,
                    scales: {
                        xAxes: [
                            {display: false, gridLines: {drawOnChartArea: false}}
                        ],
                        yAxes: [
                            {display: false, gridLines: {drawOnChartArea: false}}
                        ]
                    }
                }
            });
        }

        StatsVM.prototype.onBillStatsTemplRender = function () {
            setTimeout(function () {
            }, 2000);
        }

        StatsVM.prototype.loadStats = function () {
            console.log('Loading All Stats');
            AjaxUtils.getJSON('/stats/all')
                .done(function (resp) {
                    console.debug('Loaded Stats ' + JSON.stringify(resp.data));
                    this.stats(resp.data);

                    // Handle first load
                    this.onTasksStatsTemplRender();
                    this.onclosedClaimsStatsTemplRender();
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load Stats ' + JSON.stringify(resp));
                });
        }

        return {viewModel: StatsVM, template: statsView};

    });