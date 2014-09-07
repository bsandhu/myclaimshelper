var MongoClient = require('mongodb').MongoClient;
var jQuery = require('jquery-deferred');
var config = require('./config.js');
var _ = require('underscore');


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
    var deferred = jQuery.Deferred();

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
            function onUpdate(err, doc) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve(doc.seq);
            });
    });
    return deferred.promise();
}

function saveOrUpdateEntity(entity, colName) {
    var defer = jQuery.Deferred();

    function getSeqNum() {
        return incrementAndGet(colName);
    }

    function dbCall(seqNum) {
        run(function update(db) {
            var entityCol = db.collection(colName);

            if (!entity._id) {
                entity._id = String(seqNum);
                entityCol.insert(entity,
                    {w: 1},
                    function onInsert(err, results) {
                        console.log('Added to Mongo collection ' + colName + '. Id: ' + results[0]._id);
                        defer.resolve(err, results[0]);
                        db.close();
                    });
            } else {
                entityCol.update({'_id': entity._id},
                    entity,
                    {w: 1},
                    function onUpdate(err, result) {
                        console.log('Updated Mongo collection ' + colName + '. Id: ' + entity._id);
                        defer.resolve(err, entity);
                        db.close();
                    });
            }
        });
    }

    getSeqNum().then(dbCall).done();
    return defer;
}

function getEntityById(entityId, colName) {
    console.log('Getting Entity: ' + entityId);
    var defer = jQuery.Deferred();

    run(function (db) {
        var entityCol = db.collection(colName);
        entityCol.findOne({'_id': {'$eq': entityId}}, onResults);

        function onResults(err, item) {
            if (err) {
                defer.resolve(err);
            } else if (_.isEmpty(item)) {
                defer.resolve('No records with id ' + entityId);
            } else {
                defer.resolve(err, item);
            }
            db.close();
        }
    });
    return defer;
}

function deleteEntity(predicate, colName) {
    var defer = jQuery.Deferred();

    run(function remove(db) {
        var entityCol = db.collection(colName);
        entityCol.remove(predicate,
            {w: 1},
            function onRemove(err, result) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(result);
                }
                db.close();
            });
    });
    return defer;
}

function initCollections() {
    initCollection('Claims');
    initCollection('ClaimEntries');
    initCollection('Contacts');
    initCollection('Files');
    initCollection('Sequences');
}

exports.run = run;
exports.initCollections = initCollections;
exports.incrementAndGet = incrementAndGet;
exports.saveOrUpdateEntity = saveOrUpdateEntity;
exports.getEntityById = getEntityById;
exports.deleteEntity = deleteEntity;
