define(['jquery', 'knockout', 'KOMap', 'dropzone',
        'app/model/claim', 'app/model/ClaimEntry',
        'app/utils/ajaxUtils', 'app/utils/constants' ],
    function ($, ko, koMap, dropzone, Claim, ClaimEntry, ajaxUtils, constants) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            this.claim = new Claim();
            this.claimEntries = new ClaimEntry();
        };

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(constants.SHOW_CLAIM, function(data){

            });
            amplify.subscribe(constants.NEW_CLAIM, function(){
                this.addNewClaimEntry();
            }.bind(this));
        };

        ClaimVM.prototype.addNewClaim = function () {
            this.claim.entryDate(new Date());
            this.showNewClaimForm(true);
        };

        ClaimVM.prototype.onCancel = function () {
            this.newClaimEntry.clear();
            this.showNewClaimEntryForm(false);
        };

        ClaimVM.prototype.onSave = function () {
            var _this = this;
            console.log('Saving Claim');
            this.claim.tasks.push(this.newClaimEntry);

            ajaxUtils.post(
                '/claim',
                koMap.toJSON(this.claim),
                function (response) {
                    console.log('Saved claim: ' + JSON.stringify(response));
                    _this.showNewClaimEntryForm(false);
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