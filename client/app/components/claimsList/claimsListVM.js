define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore', 'model/claim', 'model/claimEntry', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils', 'shared/objectUtils', 'app/utils/responsive',
        'text!app/components/claimsList/claimsList.tmpl.html'],
    function ($, ko, KOMap, amplify, _, Claim, ClaimEntry, Events, Router, DateUtils, AjaxUtils, ObjectUtils, responsive, claimsListView) {
        'use strict';

        function ClaimsListVM() {
            console.log('Init ClaimsListVM');
            this.Responsive = responsive;
            this.amplify = amplify;
            this.init();
        }

        ClaimsListVM.prototype.init = function () {
            // Grouping
            this.groupBy = ko.observable();
            this.groupBy.subscribe(function () {
                this.loadClaims();
            }, this);
            this.groupBy('Open');
            this.groupByOptions = ko.observableArray(['Open', 'Closed']);

            this.claims = ko.observableArray([]);
            this.claims.subscribe(function (newVal) {
                $('#claimListTable').bootstrapTable('load', newVal);
                $('#claimListTable').bootstrapTable('hideLoading');
            });

            this.DateUtils = DateUtils;
            this.router = Router;
            this.init = false;

            amplify.subscribe(Events.SAVED_CLAIM, this, this.loadClaims);
        }

        ClaimsListVM.prototype.loadClaims = function () {
            let _this = this;
            let postReq = _this.groupBy() === 'Open'
                ? {query: {isClosed: false}}
                : {query: {isClosed: true}};

            AjaxUtils.post(
                '/claim/search',
                JSON.stringify(postReq),
                function onDone(resp) {
                    let data = resp.data;
                    console.log('Loaded Claims ' + JSON.stringify(data).substring(1, 25) + '...');

                    let tempArray = [];

                    $.each(data, function (index, claim) {
                        let claimDesc = claim.description || '';
                        let insuranceCoName = claim.insuranceCompanyName || '';
                        insuranceCoName = insuranceCoName.length > 40 ? insuranceCoName.substr(0, 40) + '...' : insuranceCoName;
                        let insuranceCompanyFileNum = claim.insuranceCompanyFileNum || '';

                        let age = Math.floor((new Date().getTime() - claim.dateReceived) / (1000 * 60 * 60 * 24));
                        let ageText = age + ' days';

                        let claimantName = ObjectUtils.nullSafe.bind(claim, 'this.claimantContact.name', 'None')();
                        let claimantId = Number(ObjectUtils.nullSafe.bind(claim, 'this.claimantContact._id', '')());
                        let claimant = claimantName;

                        let insuredName = ObjectUtils.nullSafe.bind(claim, 'this.insuredContact.name', 'None')();
                        let insuredId = Number(ObjectUtils.nullSafe.bind(claim, 'this.insuredContact._id', '')());
                        let insured = insuredName;
                        let insuranceCo = "<span>" + insuranceCompanyFileNum + "</span><span class='secondary'>" + insuranceCoName + "</span>";

                        tempArray.push({
                            claimId: claim._id,
                            fileNo: claim.fileNum,
                            desc: claimDesc.length > 40 ? claimDesc.substr(0, 40) + '...' : claimDesc,
                            insuranceCo: insuranceCo,
                            dateDue: DateUtils.niceDate(claim.dateDue, false),
                            dueTime: claim.dateDue.getTime(),
                            claimant: claimant,
                            claimantSort: claimantName,
                            insured: insured,
                            insuredSort: insuredName,
                            ageText: ageText,
                            age: age
                        });
                    });
                    _this.claims(tempArray);
                },
                function onFail() {
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: 'Error while refreshing Claims'});
                });
        };

        ClaimsListVM.prototype.onclaimsListTmplRender = function () {
            let _this = this;
            _this.panelContentHeight = $(window).height();

            $('#claimListTable').bootstrapTable({
                "height": _this.panelContentHeight,
                "cardView": _this.Responsive.onXSDevice(),
                "showExport": !_this.Responsive.onXSDevice(),

                // *** Add ev listener to the Bootstrap table ***
                "onClickRow": function (data) {
                    Router.routeToClaim(data.claimId);
                }
            });
            $('#claimListTable').bootstrapTable('showLoading');
        }

        return {viewModel: ClaimsListVM, template: claimsListView};
    });

