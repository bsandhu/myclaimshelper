define(['jquery', 'underscore', 'knockout', 'KOMap', 'amplify', 'app/utils/events',
        'text!app/components/stats/stats.tmpl.html'],
    function ($, _, ko, KOMap, amplify, Events, statsView) {

        var N = Number;

        function StatsVM() {
            console.log('Init Stats');
            this.loadStats();
            this.stats = ko.observable();


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

        StatsVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.loadStats);
            amplify.subscribe(Events.SAVED_CLAIM_ENTRY, this, this.onTasksStatsTemplRender);

        }

        StatsVM.prototype.onTasksStatsTemplRender = function () {
            $('#tasksStatsCircliful').empty().removeData();

            $('#tasksStatsCircliful')
                .data('dimension', 70)
                .data('width', 5)
                .data('fontsize', 14)
                .data('fgcolor', '#00b19d')
                .data('bgcolor', '#ebeff2')
                .data('percent', this.percentTasksDone())
                .data('text', this.percentTasksDone() + '%')
                .circliful()
        }

        StatsVM.prototype.onBillStatsTemplRender = function () {
            setTimeout(function () {
            }, 2000);
        }

        StatsVM.prototype.loadStats = function () {
            return $.getJSON('/stats/all')
                .done(function (resp) {
                    console.debug('Loaded Stats ' + JSON.stringify(resp.data));
                    this.stats(resp.data);
                    this.onTasksStatsTemplRender();
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load Stats ' + JSON.stringify(resp));
                });
        }

        return {viewModel: StatsVM, template: statsView};

    });