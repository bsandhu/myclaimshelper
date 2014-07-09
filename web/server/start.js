var restify = require('restify');
var claimsService = require('./claims/claimsService.js');
var mongoUtils = require('./mongoUtils.js');

var server;

function init() {
    server = restify.createServer();
    server.use(restify.bodyParser());
}

function setupClaimsServiceRoutes() {
    server.get('/claim', claimsService.getAllClaims);
    server.get('/claim/:id', claimsService.getClaim);
    server.post('/claim', claimsService.saveClaim);
};

function setupStaticRoutes() {
    // If the path contains model, look for the whole path in the 'shared' dir
    server.get(/\/models\/.*/, restify.serveStatic({
        directory: 'shared'
    }));
    server.get(/\/app\/.*/, restify.serveStatic({
        directory: 'client'
    }));
    server.get(/\/lib\/.*/, restify.serveStatic({
        directory: 'client'
    }));
    server.get(/\/css\/.*/, restify.serveStatic({
        directory: 'client'
    }));
    server.get(/\/images\/.*/, restify.serveStatic({
        directory: 'client'
    }));
}

function startServer() {
    server.listen(process.env.PORT || 8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupClaimsServiceRoutes();
setupStaticRoutes();
mongoUtils.initCollections();
startServer();

