define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore', 'model/claim', 'model/claimEntry', 'app/utils/events',
        'app/utils/router', 'shared/dateUtils', 'app/utils/ajaxUtils', 'shared/objectUtils',
        'text!app/components/claimsList/claimsList.tmpl.html'],
    function ($, ko, KOMap, amplify, _, Claim, ClaimEntry, Events, Router, DateUtils, AjaxUtils, ObjectUtils, claimsListView) {
        'use strict';

        function ClaimsListVM() {
            console.log('Init ClaimsListVM');
            this.init();
        }

        ClaimsListVM.prototype.init = function () {
            this.panelContentHeight = $(window).height() - (200 + $('.navbar-brand').height());

            // Grouping
            this.groupBy = ko.observable();
            this.groupBy.subscribe(function () {
                this.initDisplay();
                this.loadClaims();
            }, this);
            this.groupBy('Open');
            this.groupByOptions = ko.observableArray(['Open', 'Closed']);

            this.claims = ko.observableArray([]);
            this.claims.subscribe(function(newVal){
                $('#claimListTable').bootstrapTable('load', newVal);
                $('#claimListTable').bootstrapTable('hideLoading');
            });

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
                ? {query: {isClosed: false}}
                : {query: {isClosed: true}};

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
                        var insuranceCoName = insuranceCoName.length > 40 ? insuranceCoName.substr(0, 40) + '...' : insuranceCoName;
                        var insuranceCompanyFileNum = claim.insuranceCompanyFileNum || '';

                        var age = Math.floor((new Date().getTime() - claim.dateReceived) / (1000 * 60 * 60 * 24));
                        var ageText = age + ' days';

                        var claimantName = ObjectUtils.nullSafe.bind(claim, 'this.claimantContact.name', 'None')();
                        var claimantId = Number(ObjectUtils.nullSafe.bind(claim, 'this.claimantContact._id', '')());
                        var claimant =
                            _.isNumber(claimantId) && claimantId > 0
                                ? '<a onclick="var event = arguments[0] || window.event; ' +
                            'event.stopPropagation(); ' +
                            'amplify.publish(\'SHOW_CONTACT\', {contactId:' + claimantId + '});">' +
                            claimantName +
                            '</a>'
                                : claimantName;

                        var insuredName = ObjectUtils.nullSafe.bind(claim, 'this.insuredContact.name', 'None')();
                        var insuredId = Number(ObjectUtils.nullSafe.bind(claim, 'this.insuredContact._id', '')());
                        var insured =
                            _.isNumber(insuredId) && insuredId > 0
                                ? '<a onclick="var event = arguments[0] || window.event; ' +
                            'event.stopPropagation(); ' +
                            'amplify.publish(\'SHOW_CONTACT\', {contactId:' + insuredId + '});">' +
                            insuredName +
                            '</a>'
                                : insuredName;

                        tempArray.push({
                            claimId: claim._id,
                            fileNo: claim.fileNum,
                            desc: claimDesc.length > 40 ? claimDesc.substr(0, 40) + '...' : claimDesc,
                            insuranceCo: "<span>" + insuranceCompanyFileNum + "</span><br/><span class='secondary'>" + insuranceCoName + "</span>",
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
                    defer.reject();
                });
        };

        ClaimsListVM.prototype.initDisplay = function () {
            var _this = this;
            if (!_this.init) {
                _this.init = true;
            }

            $('#claimListTable').data('height', _this.panelContentHeight);
            $('#claimListTable').bootstrapTable();
            $('#claimListTable').bootstrapTable('showLoading');
        }

        return {viewModel: ClaimsListVM, template: claimsListView};
    });

