define(['jquery', 'knockout', 'KOMap', 'dropzone',
        'model/claim', 'model/claimEntry',
        'app/utils/ajaxUtils', 'app/utils/events', 'app/utils/router' ],
    function ($, ko, KOMap, dropzone, Claim, ClaimEntry, ajaxUtils, Events, Router) {

        function ClaimVM() {
            console.log('Init ClaimVM');

            // Model
            this.claim = ko.observable(this.newEmptyClaim());
            this.claimEntries = ko.observableArray();

            // View state
            this.inEditMode = ko.observable(false);
            this.setupEvListeners();
        };

        ClaimVM.prototype.newEmptyClaim = function(){
            var jsClaimObject = new Claim();
            var claimObjWithObservableAttributes = KOMap.fromJS(jsClaimObject);
            return claimObjWithObservableAttributes;
        };

        ClaimVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM, this, this.onShowClaim);
            amplify.subscribe(Events.NEW_CLAIM, this, this.onNewClaim);
        };

        ClaimVM.prototype.onShowClaim = function (evData) {
            console.log('Display claimId: ' + JSON.stringify(evData));
            this.claim(this.newEmptyClaim());
            this.loadClaim(evData.claimId);
        };

        ClaimVM.prototype.onNewClaim = function () {
            console.log('Adding new claim');
            this.claim(this.newEmptyClaim());
            this.claim().entryDate(new Date());
            this.inEditMode(true);
        };

        ClaimVM.prototype.onCancel = function () {
            this.inEditMode(false);
            Router.routeToHome();
        };

        ClaimVM.prototype.onSave = function () {
            var _this = this;
            console.log('Saving Claim: ' + KOMap.toJSON(this.claim));

            ajaxUtils.post(
                '/claim',
                KOMap.toJSON(this.claim),
                function onSuccess(response) {
                    console.log('Saved claim: ' + JSON.stringify(response));
                    _this.claimId = response.data._id;
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Saved'});
                });
        };

        ClaimVM.prototype.loadClaim = function (claimId) {
            var _this = this;
            $.get('/claim/' + claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data));
                    KOMap.fromJS(resp.data, {}, _this.claim);
                })
        };

        return ClaimVM;
    });