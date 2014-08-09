var MongoClient = require('mongodb').MongoClient;

var connUrl = process.env.DB || 'mongodb://localhost:9090/AgentDb';

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

function incrementAndGet(sequenceName, cb) {
    run(function (db) {
        var col = db.collection('Sequences');
        col.findAndModify(
            { _id: sequenceName },
            [
                ['_id', 1]
            ],
            { $inc: { seq: 1 } },
            {upsert: true},
            {new: true},
            onUpdate);
    });
    function onUpdate(err, doc) {
        if (err) {
            throw err;
        }
        cb(doc.seq);
    }
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
