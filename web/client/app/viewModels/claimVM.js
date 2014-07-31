define(['jquery', 'knockout', 'KOMap', 'dropzone',
        'model/claim', 'model/ClaimEntry',
        'app/utils/ajaxUtils', 'app/utils/events' ],
    function ($, ko, KOMap, dropzone, Claim, ClaimEntry, ajaxUtils, Events) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this.claim = KOMap.fromJS(new Claim());
            this.claimEntries = new ClaimEntry();

            // View state
            this.inEditMode = ko.observable(false);
            this.setupEvListeners();
        };

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
        };

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('Display claimId: ' + evData);
            koUtils.clear(this.claim());
            this.claimEntries([]);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('Adding new claim');
            this.claim.entryDate(new Date());
            this.inEditMode(true);
        };

        ClaimVM.prototype.onCancel = function () {
            this.inEditMode(false);
            this.showNewClaimEntryForm(false);
        };

        ClaimVM.prototype.onSave = function () {
            var _this = this;
            console.log('Saving Claim');

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