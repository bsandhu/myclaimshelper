define(['Path', 'app/utils/events'], function(Path, Events){

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
            amplify.publish(Events.SHOW_CLAIM, {claimId: this.params['claimId']});
        });
    };

    Router.prototype.routeToHome = function(){
        window.location.hash = '#/home';
    };

    Router.prototype.routeToClaim = function(){
        window.location.hash = '#/claim';
    };

    Router.prototype.routeToNewClaim = function(){
        window.location.hash = '#/claim';
    };

    Router.prototype.start = function(){
        console.log('Listen for Routes');
        this.setupRoutes();
        Path.listen();
    };

    return new Router();
});