var MongoClient = require('mongodb').MongoClient;

var connUrl = 'mongodb://localhost:9090/AgentDb';

function run(fn) {
    MongoClient.connect(connUrl, function (err, db) {
        if (!err) {
            console.log("Connected");
            fn(db);
        }
    });
}

function initCollection(collectionName) {
    run(function (db) {
        db.createCollection(collectionName, function (err, claims) {
            if (err) {
                throw 'Failed to create collection . ' + err;
            }
            console.log('Created collection: ' + collectionName);
        });
    });
}

function initCollections() {
    initCollection('Claims');
}

exports.run = run;
exports.initCollections = initCollections;
