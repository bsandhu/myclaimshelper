var restify = require('restify');
var config = require('./config.js');
var claimsService = require('./services/claimsService.js');
var contactService = require('./services/contactService.js');
var uploadService = require('./services/uploadService.js');
var MailRequestHandler = require('./services/mail/mailHandler.js').MailRequestHandler;
var mongoUtils = require('./mongoUtils.js');
var os = require('os');

var server;

function init() {
    server = restify.createServer();
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.authorizationParser());
    server.use(restify.dateParser());
    server.use(restify.queryParser());

    // Needed for parsing POST req body. Extract file upload.
    server.use(restify.bodyParser({
        uploadDir: os.tmpdir(),
        mapParams: true,
        mapFiles: true
    }));
    server.use(restify.jsonp());
    server.use(restify.gzipResponse());
}

function setupMailServiceRoutes(){
    var mailHandler = new MailRequestHandler();
    server.post('/mailman', mailHandler.processRequest);
}

function setupClaimsServiceRoutes() {
    server.get('/claim', claimsService.getAllClaims);
    server.get('/claim/:id', claimsService.getClaim);
    server.get('/claim/:id/entries', claimsService.getAllEntriesForClaim);
    server.post('/claim', claimsService.saveOrUpdateClaim);
    server.get('/claim/search/:search', claimsService.searchClaims);

    server.get('/claimEntry/:id', claimsService.getClaimEntry);
    server.post('/claimEntry', claimsService.saveOrUpdateClaimEntry);
    server.post('/claimEntry/modify', claimsService.modifyClaimEntry);
    server.post('/claimEntry/search', claimsService.searchClaimEntries);

    server.post('/upload', uploadService.uploadFile);
    server.get('/download', uploadService.downloadFile);

}

function setupContactServiceRoutes() {
    server.get('/contact', contactService.listAllContacts);
    server.post('/contact', contactService.saveOrUpdateContactObject);
}

function setupStaticRoutes() {
    // Server side code shared with the client
    server.get(/\/model\/.*/, restify.serveStatic({
        directory: 'server'
    }));
    server.get(/\/shared\/.*/, restify.serveStatic({
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
    server.get(/\/help\/.*/, restify.serveStatic({
        directory: 'client'
    }));
    server.get('/.*/ ', restify.serveStatic({
        'directory': 'client',
        'default'  : '/app/views/app.html'
    }));
}

function startServer() {
    server.listen(config.port, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupMailServiceRoutes();
setupClaimsServiceRoutes();
setupContactServiceRoutes();
setupStaticRoutes();
mongoUtils.initConnPool().then(mongoUtils.initCollections);
startServer();

