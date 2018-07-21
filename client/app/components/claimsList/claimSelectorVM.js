define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore',
        'model/claim', 'model/claimEntry',
        'app/utils/events', 'app/utils/router', 'shared/dateUtils',
        'app/utils/ajaxUtils', 'shared/objectUtils', 'app/utils/sessionKeys',
        'app/components/claimsList/claimsListVM',
        'text-loader!app/components/claimsList/claimSelector.tmpl.html'],
    function ($, ko, KOMap, amplify, _, Claim, ClaimEntry, Events,
              Router, DateUtils, AjaxUtils, ObjectUtils, SessionKeys, ClaimsListVM, claimsSelectorView) {
        'use strict';


        function ClaimSelectorVM() {
            console.log('Init ClaimsSelectorVM');
            var _this = this;
            this.readyToRender = ko.observable(false);

            // Share with ClaimsList
            _this.loadClaims = ClaimsListVM.viewModel.prototype.loadClaims;
            _this.groupBy = ko.observable('Open');
            _this.claims = ko.observableArray([]);

            _this.filteredClaims = ko.observableArray([]);
            _this.claims.subscribe(function(newVal){
                _this.filteredClaims(newVal);
            });
            _this.titleText = ko.observable('Select Claim');
            _this.requestSource = ko.observable();
            _this.filterText = ko.observable();
            _this.filterText.subscribe(function(newVal){
                newVal = newVal.trim();
                _this.filteredClaims(_.filter(_this.claims(), function(claim){
                    if (newVal.length < 3) {
                        return true;
                    } else {
                        return contains(claim.fileNo, newVal) ||
                        contains(claim.insuranceCo, newVal) ||
                        contains(claim.insuredSort, newVal) ||
                        contains(claim.claimantSort, newVal) ||
                        contains(claim.desc, newVal);
                    }
                }));
            });

            amplify.subscribe(Events.SELECT_CLAIM, this, this.selectClaim);
        }

        ClaimSelectorVM.prototype.selectClaim = function(evData) {
            if (!_.has(evData, 'requestSource')) {
                console.error('Expecting SELECT_CLAIM ev to carry request source');
            }
            this.readyToRender(true);
            this.titleText(evData.title);
            this.requestSource(evData.requestSource);
            this.loadClaims();
            $('#selectClaimModal').modal('show');
            $('#claimSelector-search').focus();

        }

        ClaimSelectorVM.prototype.onSelectClaim = function(claim, ev) {
            $('#selectClaimModal').modal('hide');
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_ID, claim.claimId);
            amplify.store.sessionStorage(SessionKeys.ACTIVE_CLAIM_OBJ, null);
            amplify.publish(Events.SELECTED_CLAIM, {claim: claim, requestSource: this.requestSource()});
            console.log('Selected Claim: ' + JSON.prettyPrint(claim));
        }

        ClaimSelectorVM.prototype.onClearFilterClick = function() {
            this.filterText('');
        }

        function contains(value, find){
            value = ObjectUtils.defaultValue(value, '').toUpperCase();
            find = find.toUpperCase();
            return value.indexOf(find) >= 0
        }

        return {viewModel: ClaimSelectorVM, template: claimsSelectorView};
    })
