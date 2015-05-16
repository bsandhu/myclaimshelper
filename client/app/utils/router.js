define(['Path', 'amplify', 'app/utils/events'],
    function (Path, amplify, Events) {
        'use strict';

        /**
         * Tiny wrapper around PathJS.
         *
         * Manages routes and navigation around the app.
         * The hash bang url(s) trigger Amplify events.
         * These events are picked up and handled by the appropriate ViewModels
         */
        function Router() {
            console.log('Init Router');
        }

        Router.prototype.setupRoutes = function () {
            console.log('Setup Routes');

            Path.root("#/home");

            Path.rescue(function () {
                console.error('Route not found');
            });

            Path.map("#/home").to(function () {
                amplify.publish(Events.SHOW_CLAIMS_GRID);
            });

            Path.map("#/claim").to(function () {
                amplify.publish(Events.NEW_CLAIM);
            });

            Path.map("#/claim/:claimId").to(function () {
                amplify.publish(Events.SHOW_CLAIM, {claimId: this.params.claimId});
            });

            Path.map("#/claim/:claimId/newbill").to(function () {
                amplify.publish(Events.CREATE_NEW_BILL, {claimId: this.params.claimId});
            });

            Path.map("#/claim/:claimId/bill/:billId").to(function () {
                amplify.publish(Events.SHOW_BILL, {claimId: this.params.claimId, billId: this.params.billId});
            });

            Path.map("#/claim/:claimId/billhistory").to(function () {
                amplify.publish(Events.SHOW_BILLING_HISTORY, {claimId: this.params.claimId});
            });

            Path.map("#/claimEntry/new/:entryType").to(function () {
                amplify.publish(Events.NEW_CLAIM_ENTRY, {entryType: this.params.entryType});
            });

            Path.map("#/claimEntry/:claimId/:claimEntryId").to(function () {
                amplify.publish(Events.SHOW_CLAIM_ENTRY, {claimId: this.params.claimId, claimEntryId: this.params.claimEntryId});
            });
        };

        Router.prototype.routeToHome = function () {
            window.location.hash = '#/home';
        };

        Router.prototype.routeToNewClaim = function () {
            window.location.hash = '#/claim';
        };

        Router.prototype.routeToBillingOverview = function (claimId) {
            console.log('Navigating to Billing overview ' + claimId);
            window.location.hash = '#/claim/' + claimId + '/billhistory';
        };

        Router.prototype.routeToClaim = function (claimId) {
            console.log('Navigating to claim ' + claimId);
            if (claimId) {
                window.location.hash = '#/claim/' + claimId;
            } else {
                this.routeToNewClaim();
            }
        };

        /*
         * Assuming `other` as the EntryType
         */
        Router.prototype.routeToNewClaimEntry = function () {
            console.log('Navigating to New claim entry');
            window.location.hash = '#/claimEntry/new/other';
        };

        Router.prototype.routeToClaimEntry = function (claimId, claimEntryId) {
            console.log('Navigating to claim entry ' + claimId + ',' + claimEntryId);
            if (claimEntryId) {
                window.location.hash = '#/claimEntry/' + claimId + '/' + claimEntryId;
            } else {
                this.routeToNewClaimEntry();
            }
        };

        Router.prototype.start = function () {
            console.log('Listen for Routes');
            this.setupRoutes();
            Path.listen();
        };

        return new Router();
    });