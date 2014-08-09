var restify = require('restify');
var claimsService = require('./services/claimsService.js');
var contactService = require('./services/contactService.js');
var uploadService = require('./services/uploadService.js');
var mailService = require('./services/mailService.js');
var mongoUtils = require('./mongoUtils.js');

var server;

function init() {
    server = restify.createServer();
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.authorizationParser());
    server.use(restify.dateParser());
    server.use(restify.queryParser());
    server.use(restify.bodyParser());   // Needed for parsing POST req body
    server.use(restify.jsonp());
    server.use(restify.gzipResponse());
}

function setupMailServiceRoutes(){
    server.post('/mailman', mailService.processMailRequest);
}

function setupClaimsServiceRoutes() {
    server.get('/claim', claimsService.getAllClaims);
    server.get('/claim/:id', claimsService.getClaim);

    server.get('/claimEntry/:id', claimsService.getAllEntriesForClaim);
    server.post('/claimEntry', claimsService.saveOrUpdateClaimEntry);
    server.post('/upload', uploadService.uploadArtifact);
}

function setupContactServiceRoutes() {
    server.get('/contact', contactService.listAllContacts);
    server.post('/contact', contactService.addContact);
}

function setupStaticRoutes() {
    // If the path contains model, look for the whole path in the 'shared' dir
    server.get(/\/model\/.*/, restify.serveStatic({
        directory: 'server'
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
    server.get('/.*/ ', restify.serveStatic({
        'directory': 'client',
        'default'  : '/app/views/app.html'
    }));
}

function startServer() {
    server.listen(process.env.PORT || 8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupMailServiceRoutes();
setupClaimsServiceRoutes();
setupContactServiceRoutes();
setupStaticRoutes();
mongoUtils.initCollections();
startServer();

