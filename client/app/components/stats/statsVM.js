define(['knockout', 'text!app/components/stats/stats.tmpl.html'],
    function (ko, statsView) {

        function StatsVM() {
            console.log('Init Stats');
        }

        return {viewModel: StatsVM, template: statsView};

    });