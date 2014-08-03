define(['jquery', 'knockout', 'KOMap', 'model/claim', 'model/claimEntry',
        'app/utils/ajaxUtils', 'app/utils/events' ],
    function ($, ko, KOMap, Claim, ClaimEntry, ajaxUtils, Events) {

        function ClaimEntryVM() {
            console.log('Init ClaimEntryVM');

            // Model
            this.claimEntry = ko.observable(this.newEmptyClaimEntry());

            // View state
            this.inEditMode = ko.observable(false);
            this.setupEvListeners();
        };

        ClaimEntryVM.prototype.newEmptyClaimEntry = function(){
            var jsEntryObject = new ClaimEntry();
            var entryObjWithObservableAttributes = KOMap.fromJS(jsEntryObject);
            return entryObjWithObservableAttributes;
        };

        ClaimEntryVM.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_CLAIM_ENTRY, this, this.onShowClaimEntry);
            amplify.subscribe(Events.NEW_CLAIM_ENTRY, this, this.onNewClaimEntry);
        };

        ClaimEntryVM.prototype.onShowClaimEntry = function (evData) {
            console.log('Display claimEntryId: ' + JSON.stringify(evData));
            this.claim(this.newEmptyClaimEntry());
            this.loadClaimEntry(evData.claimEntryId);
        };

        ClaimEntryVM.prototype.onNewClaimEntry = function () {
            console.log('Adding new claim entry');
            this.claimEntry(this.newEmptyClaimEntry());
            this.claimEntry().entryDate(new Date());
            this.inEditMode(true);
        };

        return ClaimEntryVM;
    });