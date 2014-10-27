define(['knockout', 'text!app/components/quickAdd/quickAdd.tmpl.html'],
    function (ko, quickAddView) {

        function QuickAddVM() {
            console.log('Init Quick Add');
        }

        return {viewModel: QuickAddVM, template: quickAddView};

    });