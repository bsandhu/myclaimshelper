define(['jquery', 'knockout', 'KOMap', 'amplify', 'app/utils/events', 'app/utils/session', 'app/utils/ajaxUtils',
        'text!app/components/billingProfile/billingProfile.tmpl.html', 'model/BillingProfile'],

    function ($, ko, KOMap, amplify, Events, Session, AjaxUtils, viewHtml, BillingProfile) {
        'use strict';

        function BillingProfileComponent(params) {
            console.log('Init BillingProfile');
            this.billingProfile = KOMap.fromJS(new BillingProfile());
            this.setupEvListeners();
        }

        BillingProfileComponent.prototype.setupEvListeners = function () {
            amplify.subscribe(Events.SHOW_BILLING_PROFILE, this, this.onShowProfile);
        };

        BillingProfileComponent.prototype.onShowProfile = function (evData) {
            if (!evData.claimId) {
                console.error('Expecting ev to carry claimId');
                return;
            }
            console.log('BillingProfileComponent - SHOW_BILLING_PROFILE ev ' + JSON.stringify(evData));
            this.loadProfile(evData.claimId);
            $('#billingProfileModal').modal();
        };

        /**
         * Note: Server will create a copy of default profile for if needed
         */
        BillingProfileComponent.prototype.loadProfile = function (claimId) {
            var _this = this;

            return $.getJSON('/billing/profile/' + claimId)
                .done(function (resp) {
                    console.debug('Loaded BillingProfile ' + JSON.stringify(resp.data).substr(0, 100));
                    KOMap.fromJS(resp.data, {}, this.billingProfile);
                }.bind(this));
        };

        BillingProfileComponent.prototype.onSave = function (claimId) {
            AjaxUtils.post(
                '/billing/profile',
                KOMap.toJSON(this.billingProfile),
                function onSuccess(response) {
                    console.log('Updated billingProfile: ' + JSON.stringify(response));
                    amplify.publish(Events.SUCCESS_NOTIFICATION, {msg: 'Biling rates updated'});
                    $('#billingProfileModal').modal('hide');
                }.bind(this),
                function onFail(response) {
                    console.log('Failure: ' + JSON.stringify(response));
                    amplify.publish(Events.FAILURE_NOTIFICATION, {msg: response.message});
                }
            );
        };

        return {viewModel: BillingProfileComponent, template: viewHtml};
    })
;
