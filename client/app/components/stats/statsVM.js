define(['jquery', 'knockout', 'KOMap', 'amplify', 'app/utils/events',
        'text!app/components/stats/stats.tmpl.html'],
    function ($, ko, KOMap, amplify, Events, statsView) {

        var N = Number;

        function StatsVM() {
            console.log('Init Stats');
            this.loadStats();
            this.stats = ko.observable();


            // Tasks stats
            this.tasksDoneToday = ko.computed(function () {
                return this.stats() ? this.stats()['TasksDoneToday'][0]['total'] : 0;
            }, this);
            this.tasksDueToday = ko.computed(function () {
                return this.stats() ? this.stats()['TasksDueToday'][0]['total'] : 0;
            }, this)
            this.percentTasksDone = ko.computed(function () {
                return Math.round((N(this.tasksDoneToday()) / N(this.tasksDueToday())) * 100);
            }, this);

            this.setupEvListeners();
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
                .data('percent', 35)
                .data('text', 35 + '%')
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
                }.bind(this))
                .fail(function (resp) {
                    console.error('Failed to load Stats ' + JSON.stringify(resp));
                });
        }

        return {viewModel: StatsVM, template: statsView};

    });