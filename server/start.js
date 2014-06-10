var restify = require('restify');
var claimsService = require('./claims/claimsService.js');

var server;

function init() {
    server = restify.createServer();
}

function setupClaimsServiceRoutes() {
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
startServer();
