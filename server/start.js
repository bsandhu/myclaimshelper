var restify = require('restify');
var serveStaticWith304 = require('./static');

var socketio = require('socket.io');
var config = require('./config.js');
var EventEmitter = require('events').EventEmitter;

var claimsService = require('./services/claimsService.js');
var billingServices = require('./services/billingServices.js');
var billingProfileService = require('./services/billingProfileService.js');
var contactService = require('./services/contactService.js');
var contactSyncService = require('./services/contactSyncService.js');
var profileService = require('./services/profileService.js');
var uploadService = require('./services/uploadService.js');
var entityExtractionService = require('./services/entityExtractionService.js');
var notificationService = require('./services/notificationService.js');
var statsService = require('./services/statsService');
var configservice = require('./services/configService');

var processMail = require('./services/mail/mailHandler.js').process;
var mongoUtils = require('./mongoUtils.js');
var Consts = require('./shared/consts.js');
var serviceUtils = require('./serviceUtils.js');
var os = require('os');
var jwt = require('jsonwebtoken');
var assert = require('assert');


// Auto0 keys
var JWT_SECRET = config.auth0_client_secret;
var DECODED_JWT_SECRET = new Buffer(JWT_SECRET, 'base64');

// Testing hooks
var DISABLE_AUTH = config.disable_auth;
var USE_SSL = config.use_ssl;
var TEST_USER = config.test_user;

// Restify server
var server = restify.createServer();
var io = socketio.listen(server);


function init() {
    server = restify.createServer();

    // Wrap with socket io instance
    io = socketio.listen(server);

    server.use(function httpsRedirect(req, res, next) {
        var securityNotNeeded = USE_SSL === false;
        var isSecure = req.isSecure() === true || req.headers['x-forwarded-proto'] == 'https';
        if (securityNotNeeded || isSecure) {
            next();
        } else {
            res.writeHead(302, {'Location': 'https://' + req.headers.host + req.url});
            res.end();
        }
    });

    // Attach handlers to Server
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

    // Inject TEST_USER if needed
    server.use(function reqSessionHandler(req, res, next) {
        if (DISABLE_AUTH) {
            req.headers.userid = TEST_USER;
        }
        next();
    });
    if (DISABLE_AUTH) {
        console.log('**** Auth is disabled. Using ' + TEST_USER + ' ****');
    }
    server.use(restify.conditionalRequest());
}

function setupStatsRoutes() {
    server.get('/stats/all', authenticate, statsService.getAllStatsREST);
}

function setupMailServiceRoutes() {
    server.post('/mailman', processMail);
}

function setupConfigServiceRoutes() {
    server.get('/config', configservice.getConfigREST);
}

function setupNotificationRoutes() {
    server.post('/notification/broadcast', notificationService.broadcast);
    server.post('/notification/markAllAsRead', notificationService.markAllAsRead);
    server.get('/notification/unreadMsgCount', notificationService.getUnreadMsgCount);
    server.get('/notification/unreadMsgs', notificationService.getUnreadMsgs);
}

function authenticate(req, res, next) {
    if (DISABLE_AUTH) {
        next();
    } else {
        assert(req.headers.userid, 'Expecting re headers to carry userId');
        assert(req.authorization.credentials, 'Expecting re headers to carry Auth info');

        jwt.verify(
            req.authorization.credentials,
            DECODED_JWT_SECRET,
            function onDecode(err, decoded) {
                if (err) {
                    console.log('Auth error: ' + err);
                    res.statusMessage = err.name ? err.name : err;
                    res.statusCode = 401;
                    res.end();
                } else {
                    console.log('Authenticated: ' + decoded.sub);
                    return next();
                }
            });
    }
}

function setupClaimsServiceRoutes() {
    server.get('/claim', authenticate, claimsService.getAllClaims);
    server.get('/claim/:id', authenticate, claimsService.getClaim);
    server.get('/claim/:id/entries', authenticate, claimsService.getAllEntriesForClaim);
    server.post('/claim', authenticate, claimsService.saveOrUpdateClaim);
    server.post('/claim/search', authenticate, claimsService.searchClaims);
    server.post('/claim/close', authenticate, claimsService.closeClaim);

    server.get('/claimEntry/:id', authenticate, claimsService.getClaimEntry);
    server.post('/claimEntry', authenticate, claimsService.saveOrUpdateClaimEntry);
    server.post('/claimEntry/modify', authenticate, claimsService.modifyClaimEntry);
    server.post('/claimEntry/search', authenticate, claimsService.searchClaimEntries);
    server.post('/claimEntry/delete', authenticate, claimsService.deleteClaimEntryREST);

    server.post('/upload', uploadService.uploadFile);
    server.get('/download', uploadService.downloadFile);

    server.post('/extract/entity', authenticate, entityExtractionService.extract);
}

function setupContactServiceRoutes() {
    server.get('/contact', authenticate, contactService.listAllContacts);
    server.get('/contact/:id', authenticate, contactService.getContact);
    server.post('/contact', authenticate, contactService.saveOrUpdateContact);

    server.get('/contactSync/auth', authenticate, contactSyncService.getAuthUrl);
    server.post('/contactSync/contacts', authenticate, contactSyncService.addContactToGoogle);
}

function setupBillingServiceRoutes() {
    server.post('/bill/search', authenticate, billingServices.getBillsREST);
    server.post('/bill', authenticate, billingServices.saveOrUpdateBillREST);
    server.get('/billingItem/search/:search', authenticate, billingServices.getBillingItemsREST);
    server.post('/billingItem', authenticate, billingServices.saveOrUpdateBillingItemsREST);
    server.get('/billing/profile/:claimId', authenticate, billingProfileService.checkAndGetBillingProfileForClaimREST);
    server.post('/billing/profile', authenticate, billingProfileService.saveOrUpdateREST);
}

function setupProfileServiceRoutes() {
    server.post('/userProfile', authenticate, profileService.saveOrUpdateUserProfileREST);
    server.get('/userProfile/:id', authenticate, profileService.checkAndGetUserProfileREST);
}

function setupStaticRoutes() {
    // Server side code shared with the client
    server.get(/\/model\/.*/, restify.serveStatic({
        directory: 'server'
    }));
    server.get(/\/shared\/.*/, restify.serveStatic({
        directory: 'server'
    }));

    server.get(/\/app\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/lib\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/css\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/img\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/help\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get('/.*/ ', serveStaticWith304({
        'directory': 'client',
        'default': '/app/components/index.html',
        maxAge: 60 * 60 * 24
    }));
}

/*********************************************************/
/* Push notifications */
/*********************************************************/

function setUpWSConn() {
    io.sockets.on('connection', function (socket) {
        console.log("Web Socket connection established");
    });
    io.sockets.on('disconnect', function (socket) {
        console.log("Web Socket disconnected");
    });
}

function setupBroadcastListener() {
    serviceUtils.eventEmitter.on('foo', function onMsg(notification) {
        console.log('Broadcasting: ' + JSON.stringify(notification));
        io.emit('broadcast', notification, {for: 'everyone'});
    });
}

/*********************************************************/
/* End of Push notifications */
/*********************************************************/

function startServer() {
    server.listen(config.port, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupConfigServiceRoutes();
setupStatsRoutes();
setupMailServiceRoutes();
setupBillingServiceRoutes();
setupClaimsServiceRoutes();
setupContactServiceRoutes();
setupProfileServiceRoutes();
setupNotificationRoutes();
setupStaticRoutes();
setUpWSConn();
setupBroadcastListener();
mongoUtils.initConnPool().then(mongoUtils.initCollections);
startServer();