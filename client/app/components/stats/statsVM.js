define(['knockout', 'text!app/components/stats/stats.tmpl.html'],
    function (ko, statsView) {

        function StatsVM() {
            console.log('Init Stats');
        }

        StatsVM.prototype.onTasksStatsTemplRender = function () {
            setTimeout(function () {
                $('#tasksStatsCircliful').circliful()
            }, 2000);
        }

        StatsVM.prototype.onBillStatsTemplRender = function () {
            setTimeout(function () {
            }, 2000);
        }

        return {viewModel: StatsVM, template: statsView};

    });