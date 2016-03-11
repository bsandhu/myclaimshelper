define(['jquery', 'underscore', 'chartjs', 'knockout', 'KOMap', 'amplify',
        'app/utils/events', 'shared/NumberUtils',
        'text!app/components/stats/stats.tmpl.html'],
    function ($, _, Chart, ko, KOMap, amplify, Events, NumberUtils, statsView) {

        var N = Number;

        function StatsVM() {
            console.log('Init Stats');
            this.loadStats();
            this.stats = ko.observable();
            this.NumberUtils = NumberUtils;

            // Tasks stats
            this.tasksDoneToday = ko.computed(function () {
                return this.nullSafeStats("['TasksDoneToday'][0]['total']");
            }, this);
            this.tasksDueToday = ko.computed(function () {
                return this.nullSafeStats("['TasksDueToday'][0]['total']");
            }, this);
            this.percentTasksDone = ko.computed(function () {
                return  N(this.tasksDueToday()) > 0
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
                            _.map(this.stats()['TaskByCategory'], function(i){return capitalizeFirstLetter(i._id[0])}),
                            _.map(this.stats()['TaskByCategory'], function(i){return i.total}))
                    : ''
            }, this);
            // Billing
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
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.loadStats);
            amplify.subscribe(Events.SAVED_BILL, this, this.loadStats);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.onTasksStatsTemplRender);
        }

        StatsVM.prototype.onTasksStatsTemplRender = function () {
            console.log('Rendering task Stats');
            $('#tasksStatsCircliful').empty().removeData();

            $('#tasksStatsCircliful')
                .data('dimension', 70)
                .data('width', 5)
                .data('fontsize', 14)
                .data('fgcolor', '#00b19d')
                .data('bgcolor', '#ebeff2')
                .data('percent', this.percentTasksDone())
                .data('text', this.percentTasksDone() + '%')
                .circliful();

           /* var ctx = document.getElementById("tasksStatsByType").getContext("2d");
            var data = [
                {
                    value: 300,
                    color:"#F7464A",
                    highlight: "#FF5A5E",
                    label: "Visit"
                },
                {
                    value: 50,
                    color: "#46BFBD",
                    highlight: "#5AD3D1",
                    label: "Photos"
                },
                {
                    value: 100,
                    color: "#FDB45C",
                    highlight: "#FFC870",
                    label: "Phone"
                }
            ];
            var options = {animateScale: false, animation: false}
            var myChart = new Chart(ctx).Pie(data, options);*/
        }

        StatsVM.prototype.onBillStatsTemplRender = function () {
            setTimeout(function () {
            }, 2000);
        }

        StatsVM.prototype.loadStats = function () {
            console.log('Loading All Stats');
            return $.getJSON('/stats/all')
                .done(function (resp) {
                    console.debug('Loaded Stats ' + JSON.stringify(resp.data));
                    this.stats(resp.data);
                    // Handle first load
                    this.onTasksStatsTemplRender();
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load Stats ' + JSON.stringify(resp));
                });
        }

        return {viewModel: StatsVM, template: statsView};

    });