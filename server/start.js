let fs = require('fs');
let path = require('path');
let restify = require('restify');
let serveStaticWith304 = require('./static');

let socketio = require('socket.io');
let config = require('./config.js');
let EventEmitter = require('events').EventEmitter;

let claimsService = require('./services/claimsService.js');
let refDataService = require('./services/refDataService.js');
let formService = require('./services/formService.js');
let billingServices = require('./services/billingServices.js');
let billingProfileService = require('./services/billingProfileService.js');
let contactService = require('./services/contactService.js');
let contactSyncService = require('./services/contactSyncService.js');
let profileService = require('./services/profileService.js');
let uploadService = require('./services/uploadService.js');
let entityExtractionService = require('./services/entityExtractionService.js');
let notificationService = require('./services/notificationService.js');
let statsService = require('./services/statsService');
let configservice = require('./services/configService');
let pdfService = require('./services/pdfService.js');

let processMail = require('./services/mail/mailHandler.js').process;
let mongoUtils = require('./mongoUtils.js');
let Consts = require('./shared/consts.js');
let serviceUtils = require('./serviceUtils.js');
let os = require('os');
let jwt = require('jsonwebtoken');
let assert = require('assert');


// Auto0 keys
let JWT_SECRET = config.auth0_client_secret;
let DECODED_JWT_SECRET = new Buffer(JWT_SECRET, 'base64');

// Testing hooks
let DISABLE_AUTH = config.disable_auth;
let USE_SSL = config.use_ssl;
let TEST_USER = config.test_user;

let server, http_server;
if (USE_SSL) {
    // Restify server - pass in certs for https
    let https_options = {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'www_myclaimshelper_com.key')),
        certificate: fs.readFileSync(path.join(__dirname, 'cert', 'www_myclaimshelper_com.pem'))
    };
    server = restify.createServer(https_options);
    http_server = restify.createServer();
} else {
    server = restify.createServer();
    http_server = null;
}

// Socket IO
let io = socketio.listen(server.server);


function init() {
    function httpsRedirect(req, res, next) {
        let sslNeeded = USE_SSL === true;
        console.log("Secure conn needed: " + sslNeeded);

        if (sslNeeded) {
            let secureUrl = 'https://' + req.headers.host.split(':')[0] + ':' + config.https_port + req.url;
            console.log("Redirecting to https: " + secureUrl);
            res.writeHead(302, {'Location': secureUrl});
            res.end();
        } else {
            next();
        }
    }

    if (http_server) {
        http_server.use(httpsRedirect);
    }

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
    server.get('/claim/:id', authenticate, claimsService.getClaim);
    server.get('/claim/:id/entries', authenticate, claimsService.getAllEntriesForClaim);
    server.get('/claim/:id/forms', authenticate, formService.getAllFormsForClaim);
    server.post('/claim', authenticate, claimsService.saveOrUpdateClaim);
    server.post('/claim/search', authenticate, claimsService.searchClaims);
    server.post('/claim/close', authenticate, claimsService.closeClaim);
    server.post('/claim/modify', authenticate, claimsService.modifyClaim);

    server.get('/claimEntry/:id', authenticate, claimsService.getClaimEntry);
    server.post('/claimEntry', authenticate, claimsService.saveOrUpdateClaimEntry);
    server.post('/claimEntry/modify', authenticate, claimsService.modifyClaimEntry);
    server.post('/claimEntry/search', authenticate, claimsService.searchClaimEntries);
    server.post('/claimEntry/delete', authenticate, claimsService.deleteClaimEntryREST);

    server.post('/upload', uploadService.uploadFile);
    server.get('/download', uploadService.downloadFile);

    server.post('/convertToPdf', pdfService.convertToPdf);
    server.post('/emailPdf', pdfService.emailPdf);

    server.post('/extract/entity', authenticate, entityExtractionService.extract);
    server.get('/refData/:type', authenticate, refDataService.getRefData);
    server.post('/refData', authenticate, refDataService.addRefData);

    server.get('/form/:id', authenticate, formService.getFormData);
    server.post('/form', authenticate, formService.addFormData);
    server.post('/form/delete', authenticate, formService.deleteForm);
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
    server.get('/billing/codes', authenticate, billingProfileService.codesInUse);
}

function setupProfileServiceRoutes() {
    server.post('/userProfile', authenticate, profileService.saveOrUpdateUserProfileREST);
    server.post('/userProfile/modify', authenticate, profileService.modifyUserProfileREST);
    server.get('/userProfile/:id', authenticate, profileService.checkAndGetUserProfileREST);
}

function setupStaticRoutes() {

    // **** Google verification ****

    server.get(/\/google4e30704a510d46ba.html/, serveStaticWith304({
        directory: 'site/myclaimshelper',
        'file': 'google4e30704a510d46ba.html',
        maxAge: 60 * 60 * 24
    }));

    server.get(/\/myclaimshelper\/.*/, serveStaticWith304({
        directory: 'site',
        'default': 'index.html',
        'file': 'index.html',
        maxAge: 60 * 60 * 24
    }));


    // **** Server side code shared with the client ****

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
    server.get(/\/built\/.*/, serveStaticWith304({
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
    server.get(/\/fonts\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/img\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/audio\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));
    server.get(/\/help\/.*/, serveStaticWith304({
        directory: 'client',
        maxAge: 60 * 60 * 24
    }));

    // **** Static site ****

    server.get('/.*/ ', serveStaticWith304({
        'directory': 'site',
        'default': 'myclaimshelper/redirect.html',
        maxAge: 60 * 60 * 24
    }));
    if (http_server) {
        http_server.get('/.*/ ', serveStaticWith304({
            'directory': 'site',
            'default': 'myclaimshelper/redirect.html',
            maxAge: 60 * 60 * 24
        }));
    }
}

/*********************************************************/
/* Push notifications */
/*********************************************************/

function setUpWSConn() {
    io.sockets.on('connection', function (socket) {
        console.log("Web Socket connection established");

        // UserId is used as roomName
        socket.on('joinRoom', function (userId) {
            console.log('WS addToRoom: ' + userId);
            socket.join(userId);
        });
    });
    io.sockets.on('disconnect', function (socket) {
        console.log("Web Socket disconnected");
    });

}

function setupBroadcastListener() {
    serviceUtils.eventEmitter.on('foo', function onMsg(notification, userid) {
        console.log('Broadcasting to ' + userid + ', ' + JSON.stringify(notification));

        // 'userid' is the 'room' - one room per user
        io.sockets.in(userid).emit(userid, notification);
    });
}

/*********************************************************/
/* End of Push notifications */
/*********************************************************/

function startServer() {
    // If https is enabled, start two servers and re-direct to https
    // See: http://stackoverflow.com/questions/33666226/get-restify-rest-api-server-to-support-both-https-and-http

    if (http_server) {
        server.listen(config.https_port, function () {
            console.log('%s listening at %s', server.name, server.url);
        });
        http_server.listen(config.port, function () {
            console.log('%s listening at %s', server.name, server.url);
        });
    } else {
        server.listen(config.port, function () {
            console.log('%s listening at %s', server.name, server.url);
        });
    }
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