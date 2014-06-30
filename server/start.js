var restify = require('restify');
var claimsService = require('./claims/claimsService.js');
var mongoUtils = require('./MongoUtils.js');

var server;

function init() {
    server = restify.createServer();
    server.use(restify.bodyParser());
}

function setupClaimsServiceRoutes() {
    server.get('/claim/getAll', claimsService.getAllClaims);
    server.post('/claim/save', claimsService.saveClaim);
    server.post('/claimEntry/save', claimsService.saveClaimEntry);
    server.get('/claim/getEntries/:id', claimsService.getEntries);
    server.get('/claim/:id', claimsService.getClaim);
};

function setupStaticRoutes() {
    // If the path contains model, look for the whole path in the 'shared' dir
    server.get(/\/models\/.*/, restify.serveStatic({
        directory: 'shared'
    }));
    server.get(/\/claims\/.*/, restify.serveStatic({
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
    server.listen(8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupClaimsServiceRoutes();
setupStaticRoutes();
mongoUtils.initCollections();
startServer();

