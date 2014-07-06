define(['jquery', 'knockout', 'KOMap', 'claims/AjaxUtils',
        'claims/Claim', 'claims/ClaimDetailEntry' ],
    function ($, ko, koMap, AjaxUtils, Claim, ClaimDetailEntry) {

        function ClaimsVM(claimId) {
            if (!claimId) {
                throw "Expecting Claim Id";
            }
            console.log('Init ClaimDetailsVM. ClaimId: ' + claimId);

            this.claimId = claimId;
            this.showNewClaimEntryForm = ko.observable(false);

            this.claim = new Claim();
            this.claimEntry = new ClaimDetailEntry();
            this.claimEntries = ko.observableArray([]);

            this.loadClaim();
            this.loadClaimEntries();
        };

        ClaimsVM.prototype.addNewClaimEntry = function () {
            this.claimEntry.claimId(this.claimId);
            this.showNewClaimEntryForm(true);
        };

        ClaimsVM.prototype.onSave = function () {
            var _this = this;
            console.log("Saving ..");
            AjaxUtils.post(
                '/claimEntry/save',
                JSON.stringify(ko.toJS(this.claimEntry)),
                function () {
                    console.log("Saved");
                    _this.showNewClaimEntryForm(false);
                    _this.loadClaimEntries();
                });
        };

        ClaimsVM.prototype.loadClaim = function () {
            var _this = this;
            $.get('/claim/' + _this.claimId)
                .done(function (resp) {
                    console.log('Loaded claim ' + JSON.stringify(resp.data));
                    koMap.fromJS(resp.data, {}, _this.claim);
                })
        };

        ClaimsVM.prototype.loadClaimEntries = function () {
            var _this = this;
            $.get('/claim/getEntries/' + _this.claimId)
                .done(function (data) {
                    console.log('Loaded claim entries ' + JSON.stringify(data));
                    var entries = data.data;

                    $.each(entries, function (index, claimentry) {
                        _this.claimEntries.push(koMap.fromJS(claimentry, new ClaimDetailEntry()));
                    });
                })
        };

        return ClaimsVM;
    });