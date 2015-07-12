define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils',
        'text!app/components/claimsList/claimsList.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Events, Router, DateUtils, AjaxUtils, claimsListView) {
        'use strict';

        function ClaimsListVM() {
            console.log('Init ClaimsListVM');

            this.DateUtils = DateUtils;
            this.claims = ko.observableArray([]);
            this.searchResults = ko.observableArray([]);
            this.searchText = ko.observable('');

            this.loadClaims();
            //this.setupSearchListeners();
        }

        ClaimsListVM.prototype.onClaimSelect = function (vm, event, data) {
            Router.routeToClaim(data.claimId);
        };

        ClaimsListVM.prototype.loadClaims = function () {
            var _this = this;
            $.get('/claim')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claims ' + JSON.stringify(data).substring(1, 25) + '...');

                    var tempArray = [];
                    $.each(data, function (index, claim) {
                        var koClaim = KOMap.fromJS(claim, {}, new Claim());
                        tempArray.push(koClaim);
                    });
                    _this.claims(tempArray);
                    _this.searchResults(tempArray);
                })
                .fail(function () {
                    console.log('Fail');
                });
        };

        ClaimsListVM.prototype.searchClaims = function (query) {
            console.log('Searching for claims: ' + query);
            var _this = this;
            $("#notifier-container").hide();

            $.getJSON('claim/search/' + query)
                .done(function (res) {
                    var data = res.data;
                    var tempArray = [];
                    console.log(JSON.stringify(data));

                    if (data[0] != 'N') {
                        $.each(data, function (index, claim) {
                            var koClaim = KOMap.fromJS(claim, {}, new Claim());
                            tempArray.push(koClaim);
                        });
                        amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Found Claims'});
                    }
                    else {
                        amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'No Claims Found'});
                    }
                    _this.claims(tempArray);
                    _this.searchResults(tempArray);

                })
                .fail(function () {
                    console.log('Problem with DB query');
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Problem with DB'});
                });
        };

        /**********************************************/
        /* Search                                     */
        /**********************************************/

        ClaimsListVM.prototype.onSearchClear = function () {
            var temp = [];
            $.each(this.claims(), function (index, claim) {
                temp.push(claim);
            });
            this.searchResults(temp);
            this.searchText('');
        };

        ClaimsListVM.prototype.setupSearchListeners = function () {
            this.searchText.subscribe(onSearchTxtUpdate);
            var _this = this;

            function onSearchTxtUpdate(txt) {
                var localMatches = [];
                console.log('Search... ' + txt);
                if (txt.length === 0) {
                    _this.onSearchClear();
                    return;
                }
                if (txt.length < 3) {
                    return;
                }
                $.each(_this.claims(),
                    function filterBySearchText(index, claim) {
                        var desc = KOMap.toJSON(claim) || '';
                        if (desc.toUpperCase().search(_this.searchText().toUpperCase()) >= 0) {
                            localMatches.push(claim);
                        }
                    }
                );
                _this.searchResults(localMatches);
            }
        };

        return {viewModel: ClaimsListVM, template: claimsListView};
    });