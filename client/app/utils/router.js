define(['Path', 'amplify', 'app/utils/events'],
    function(Path, amplify, Events){
    'use strict';

    /**
     * Tiny wrapper around PathJS.
     *
     * Manages routes and navigation around the app.
     * The hash bang url(s) trigger Amplify events.
     * These events are picked up and handled by the appropriate ViewModels
     */
    function Router(){
        console.log('Init Router');
    }

    Router.prototype.setupRoutes = function(){
        console.log('Setup Routes');

        Path.root("#/home");

        Path.rescue(function(){
            console.error('Route not found');
        });

        Path.map("#/home").to(function(){
            amplify.publish(Events.SHOW_CLAIMS_GRID);
        });

        Path.map("#/claim").to(function(){
            amplify.publish(Events.NEW_CLAIM);
        });

        Path.map("#/claim/:claimId").to(function(){
            amplify.publish(Events.SHOW_CLAIM, {claimId: this.params.claimId});
        });

        Path.map("#/claimEntry/new/:entryType").to(function(){
            amplify.publish(Events.NEW_CLAIM_ENTRY, {entryType: this.params.entryType});
        });

        Path.map("#/claimEntry/:claimEntryId").to(function(){
            amplify.publish(Events.SHOW_CLAIM_ENTRY, {claimEntryId: this.params.claimEntryId});
        });
    };

    Router.prototype.routeToHome = function(){
        window.location.hash = '#/home';
    };

    Router.prototype.routeToNewClaim = function(){
        window.location.hash = '#/claim';
    };

    Router.prototype.routeToClaim = function(claimId){
        console.log('Navigating to claim ' + claimId);
        if (claimId) {
            window.location.hash = '#/claim/' + claimId;
        } else {
            this.routeToNewClaim();
        }
    };

    Router.prototype.routeToNewClaimEntry = function(){
        window.location.hash = '#/claimEntry/new/other';
    };

    Router.prototype.routeToClaimEntry = function(claimEntryId){
        console.log('Navigating to claim entry ' + claimEntryId);
        if (claimEntryId) {
            window.location.hash = '#/claimEntry/' + claimEntryId;
        } else {
            this.routeToNewClaimEntry();
        }
    };

    Router.prototype.start = function(){
        console.log('Listen for Routes');
        this.setupRoutes();
        Path.listen();
    };

    return new Router();
});