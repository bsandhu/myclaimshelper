define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils',
        'text!app/components/claimsList/claimsList.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Events, Router, DateUtils, AjaxUtils, claimsListView) {
        'use strict';

        function ClaimsListVM() {
            console.log('Init ClaimsListVM');

            this.DateUtils = DateUtils;
            this.loadClaims();
            amplify.subscribe(Events.SAVED_CLAIM, this, this.loadClaims);
        }

        ClaimsListVM.prototype.onClaimSelect = function (vm, event, data) {
            Router.routeToClaim(data.claimId);
        };

        ClaimsListVM.prototype.loadClaims = function () {
            var _this = this;
            $('#claimListTable').bootstrapTable();
            $('#claimListTable').bootstrapTable('showLoading');

            $.get('/claim')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claims ' + JSON.stringify(data).substring(1, 25) + '...');

                    var tempArray = [];
                    $.each(data, function (index, claim) {
                        var claimDesc = claim.description || '';
                        var insuranceCoName = claim.insuranceCompanyName || '';
                        tempArray.push({
                            claimId: claim._id,
                            fileNo: claim.insuranceCompanyFileNum,
                            desc: claimDesc.length > 40 ? claimDesc.substr(0, 40) + '...' : claimDesc,
                            insuranceCo: insuranceCoName.length > 40 ? insuranceCoName.substr(0, 40) + '...' : insuranceCoName,
                            date1: DateUtils.niceDate(claim.dateReceived, false),
                            dateDue: DateUtils.niceDate(claim.dateDue, false)
                        });
                    });
                    $('#claimListTable').bootstrapTable('append', tempArray);
                    $('#claimListTable').bootstrapTable('hideLoading');
                })
                .fail(function () {
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while refreshing Claims'});
                    defer.reject();
                });
        };

        return {viewModel: ClaimsListVM, template: claimsListView};
    });