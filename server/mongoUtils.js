var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var config = require('./config.js');

function run(fn) {
    MongoClient.connect(config.db, function (err, db) {
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

function incrementAndGet(sequenceName) {
    var deferred = Q.defer();

    run(function (db) {
        var col = db.collection('Sequences');

        col.findAndModify(
            { _id: sequenceName },
            [['_id', 1]],
            { $inc: { seq: 1 } },
            {upsert: true},
            {new: true},
            function onUpdate(err, doc) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve(doc.seq);
            });
    });
    return deferred.promise;
}

function initCollections() {
    initCollection('Claims');
    initCollection('ClaimEntries');
    initCollection('Contacts');
    initCollection('Sequences');
}

exports.run = run;
exports.initCollections = initCollections;
exports.incrementAndGet = incrementAndGet;
