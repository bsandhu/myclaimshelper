define(['jquery', 'knockout', 'KOMap', 'amplify', 'model/claim', 'model/claimEntry', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils', 'shared/objectUtils',
        'text!app/components/claimsList/claimsList.tmpl.html'],
    function ($, ko, KOMap, amplify, Claim, ClaimEntry, Events, Router, DateUtils, AjaxUtils, ObjectUtils, claimsListView) {
        'use strict';

        function ClaimsListVM() {
            console.log('Init ClaimsListVM');

            // Grouping
            this.groupBy = ko.observable();
            this.groupBy.subscribe(function(){
                this.loadClaims();
            }, this);
            this.groupBy('Open');
            this.groupByOptions = ko.observableArray(['Open', 'Closed']);

            this.DateUtils = DateUtils;
            this.router = Router;
            this.init = false;

            amplify.subscribe(Events.SAVED_CLAIM, this, this.loadClaims);
        }

        ClaimsListVM.prototype.onClaimSelect = function (vm, event, data) {
            Router.routeToClaim(data.claimId);
        };

        ClaimsListVM.prototype.loadClaims = function () {
            var _this = this;
            var postReq = _this.groupBy() === 'Open'
                            ? { query: {isClosed: false}}
                            : { query: {isClosed: true}};

            if (!_this.init) {
                $('#claimListTable').bootstrapTable();
                $('#claimListTable').bootstrapTable('showLoading');
                _this.init = true;
            }

            AjaxUtils.post(
                '/claim/search',
                JSON.stringify(postReq),
                function onDone(resp) {
                    var data = resp.data;
                    console.log('Loaded Claims ' + JSON.stringify(data).substring(1, 25) + '...');

                    var tempArray = [];

                    $.each(data, function (index, claim) {
                        var claimDesc = claim.description || '';
                        var insuranceCoName = claim.insuranceCompanyName || '';
                        var age = Math.floor((new Date().getTime() - claim.dateReceived) / (1000 * 60 * 60 * 24));
                        var ageText = age + ' days';

                        tempArray.push({
                            claimId: claim._id,
                            fileNo: claim.insuranceCompanyFileNum,
                            desc: claimDesc.length > 40 ? claimDesc.substr(0, 40) + '...' : claimDesc,
                            insuranceCo: insuranceCoName.length > 40 ? insuranceCoName.substr(0, 40) + '...' : insuranceCoName,
                            dateReceived: DateUtils.niceDate(claim.dateReceived, false),
                            dateDue: DateUtils.niceDate(claim.dateDue, false),
                            claimant: ObjectUtils.nullSafe.bind(claim, 'this.claimantContact.name', 'None')(),
                            insured: ObjectUtils.nullSafe.bind(claim, 'this.insuredContact.name', 'None')(),
                            age: ageText
                        });
                    });
                    $('#claimListTable').bootstrapTable('load', tempArray);
                    $('#claimListTable').bootstrapTable('hideLoading');
                },
                function onFail() {
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while refreshing Claims'});
                    defer.reject();
                });
        };

        return {viewModel: ClaimsListVM, template: claimsListView};
    });

