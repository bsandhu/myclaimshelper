define(['jquery', 'knockout', 'KOMap', 'app/AjaxUtils',
        'app/model/claim', 'app/model/Task' ],
    function ($, ko, koMap, AjaxUtils, Claim, Task) {

        function ClaimVM(claimId) {
            if (!claimId) {
                throw 'Expecting Claim Id';
            }
            console.log('Init ClaimDetailsVM. ClaimId: ' + claimId);
            var isNew = claimId === 'new';

            this.claimId = claimId;
            this.showNewTaskForm = ko.observable(false);

            this.claim = new Claim();
            this.newTask = new Task();

            if (!isNew) {
                this.loadClaim();
            } else {
                this.claim.entryDate(new Date());
            }
        };

        ClaimVM.prototype.addNewTask = function () {
            this.newTask.entryDate(new Date());
            this.showNewTaskForm(true);
        };

        ClaimVM.prototype.onCancel = function () {
            this.newTask.clear();
            this.showNewTaskForm(false);
        };

        ClaimVM.prototype.onSave = function () {
            var _this = this;
            console.log('Saving Claim');
            this.claim.tasks.push(this.newTask);

            AjaxUtils.post(
                '/claim',
                JSON.stringify(ko.toJS(this.claim)),
                function () {
                    console.log('Saved claim');
                    _this.showNewTaskForm(false);
                    _this.loadClaim();
                });
        };

        ClaimVM.prototype.loadClaim = function () {
            var _this = this;
            $.get('/claim/' + _this.claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data));
                    koMap.fromJS(resp.data, {}, _this.claim);
                })
        };

        return ClaimVM;
    });