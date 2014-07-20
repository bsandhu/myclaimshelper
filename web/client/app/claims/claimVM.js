define(['jquery', 'knockout', 'KOMap', 'app/ajaxUtils',
        'app/model/claim', 'app/model/Task', 'dropzone' ],
    function ($, ko, koMap, ajaxUtils, Claim, Task) {

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

        ClaimVM.prototype.configureDropzone = function () {
            thumbnailWidth
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

            ajaxUtils.post(
                '/claim',
                koMap.toJSON(this.claim),
                function (response) {
                    console.log('Saved claim: ' + JSON.stringify(response));
                    _this.showNewTaskForm(false);
                    _this.claimId = response.data[0]._id;
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