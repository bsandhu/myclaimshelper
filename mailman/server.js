var fs = require('fs');
var restify = require('restify');
var mailHandler = require('./handlers/mailHandler.js');

var server;

function init() {
    server = restify.createServer();
    server.use(restify.bodyParser());
}

function setupRoutes() {
    server.post('/mailman', mailHandler.processMailRequest);
}


function startServer() {
    server.listen(process.env.PORT || 8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

init();
setupRoutes();
startServer();

