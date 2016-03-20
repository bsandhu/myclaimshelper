var MongoClient = require('mongodb').MongoClient;
var jQuery = require('jquery-deferred');
var config = require('./config.js');
var Consts = require('./shared/consts.js');
var _ = require('underscore');
var assert = require('assert');


var dbConn;

// :: Promise -> a -> b -> none
function _onResult(result, err, ok) {
    if (err) {
        console.log('Error: ' + err.message);
        result.reject(err);
    } else {
        result.resolve(ok);
    }
};

// :: f -> Dict -> [Obj]
// convert a dict into an Object with dot-accessible attributes
function hydrate(type, objects) {
    var objs = _.isArray(objects) ? objects : [objects];
    var fn = function (obj) {
        return _.extend(new type(), obj)
    };
    var hydrated = _.map(objs, fn);
    return hydrated;
}

function initConnPool() {
    var deferred = jQuery.Deferred();
    console.log('**** DB **** ' + config.db);
    MongoClient.connect(config.db, function (err, db) {
        if (!err) {
            console.log("Connected");
            dbConn = db;
            deferred.resolve(db);
        } else {
            console.error("Conn error " + err);
            deferred.reject(err);
        }
    });
    return deferred;
}

function run(fn) {
    if (!dbConn) {
        initConnPool().then(fn);
    } else {
        fn(dbConn);
    }
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
                    console.error(err);
                    deferred.reject(err);
                    return;
                }
                console.log('Generated Seq number for: ' + sequenceName + '. ' + doc.seq);
                deferred.resolve(doc.seq);
            });
    });
    return deferred.promise();
}

function saveOrUpdateEntity(entity, colName, owner) {
    console.log('saveOrUpdateEntity. ' + JSON.stringify(entity) + '. Collection name: ' + colName);
    checkOwnerPresent(entity);
    var defer = jQuery.Deferred();

    function getSeqNum() {
        return incrementAndGet(colName);
    }

    function dbCall(seqNum) {
        run(function update(db) {
            var entityCol = db.collection(colName);
            if (!entity._id) {
                // Note: Ids are always Strings .. not numbers
                entity._id = String(seqNum);
                entityCol.insert(entity,
                    {w: 1},
                    function onInsert(err, results) {
                        console.log('Added to Mongo collection ' + colName + '. Id: ' + results[0]._id);
                        defer.resolve(err, results[0]);

                    });
            } else {
                entityCol.update({'_id': entity._id},
                    entity,
                    {w: 1, upsert: true},
                    function onUpdate(err, result) {
                        console.log('Updated Mongo collection ' + colName + '. Id: ' + entity._id);
                        defer.resolve(err, entity);
                    });
            }
        });
    }

    getSeqNum().then(dbCall).done();
    return defer;
}

function modifyEntityAttr(entityId, colName, attributesAsJson) {
    var defer = jQuery.Deferred();
    if (!entityId) {
        defer.reject("EntityId not specified");
    }

    run(function update(db) {
        var entityCol = db.collection(colName);
        entityCol.update(
            {'_id': entityId},
            {$set: attributesAsJson},
            {w: 1},
            function onUpdate(err, result) {
                console.log('Modified Mongo collection ' + colName + '. Id: ' + entityId);
                defer.resolve(err, entityId);
            });
    });
    return defer;
}

function modifyAttr(colName, attributesAsJson, search) {
    search = search || {};
    console.log(
            'Modifing ' + JSON.stringify(colName)
          + ' with ' + JSON.stringify(attributesAsJson)
          + ' Search: ' + search);

    var defer = jQuery.Deferred();
    run(function update(db) {
        var entityCol = db.collection(colName);
        entityCol.update(
            search,
            {$set: attributesAsJson},
            {w: 1, multi: true},
            function onUpdate(err, result) {
                console.log('Modified Mongo collection ' + colName);
                if (err) {
                    console.error(err);
                    defer.reject(err);
                } else {
                    defer.resolve();
                }
            });
    });
    return defer;
}

function checkOwnerPresent(obj) {
    if (_.isObject(obj)) {
        assert(obj.owner != null && obj.owner != undefined, 'Owner attr must be present');
    } else {
        assert(obj.length > 0, 'Owner attr must be present');
    }
}

function getEntityById(entityId, colName, owner) {
    assert(owner, 'Owner attr must be present');
    console.log('Getting Entity: ' + entityId);
    var defer = jQuery.Deferred();
    checkOwnerPresent(owner);

    run(function (db) {
        var entityCol = db.collection(colName);
        entityCol.findOne({'_id': {'$eq': entityId}, 'owner': {'$eq': owner}}, onResults);

        function onResults(err, item) {
            if (err) {
                defer.resolve(err);
            } else if (_.isEmpty(item)) {
                defer.resolve('No records with id ' + entityId);
            } else {
                defer.resolve(err, item);
            }
        }
    });
    return defer;
}

// :: Object -> String -> Promise
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
                    defer.resolve();
                }
            });
    });
    return defer;
}

// :: None -> Promise
var connect = function () {
    var result = jQuery.Deferred();
    if (!dbConn) {
        MongoClient.connect(config.db, _.partial(_onResult, result));
    } else {
        result.resolve(dbConn);
    }
    return result;
}

// :: String -> Dict -> DB -> Promise
var findEntities = function (collectionName, search, db, checkOwnerAttr) {
    // Default to checking the owner attr
    if (checkOwnerAttr === null || checkOwnerAttr === undefined) {
        checkOwnerAttr = true;
    }
    if (checkOwnerAttr) {
        checkOwnerPresent(search);
    }
    console.log('Find entities: ' + collectionName + ', Search: ' + JSON.stringify(search));

    var result = jQuery.Deferred();
    var collection = db.collection(collectionName);
    collection.find(search).toArray(function (err, resp) {
        _onResult(result, err, resp);
    });
    return result;
}


function initCollections() {
    initCollection('Bills');
    initCollection('BillingItems');
    initCollection('Claims');
    initCollection('ClaimEntries');
    initCollection('Contacts');
    initCollection('Files');
    initCollection('Sequences');
    initCollection('UserProfiles');
    initCollection('Notifications');
}

exports.run = run;
exports.hydrate = hydrate;
exports.initConnPool = initConnPool;
exports.initCollections = initCollections;
exports.incrementAndGet = incrementAndGet;
exports.saveOrUpdateEntity = saveOrUpdateEntity;
exports.modifyEntityAttr = modifyEntityAttr;
exports.modifyAttr = modifyAttr;
exports.getEntityById = getEntityById;
exports.deleteEntity = deleteEntity;
exports.findEntities = findEntities;
exports.connect = connect;

exports.CLAIMS_COL_NAME = 'Claims';
exports.CLAIM_ENTRIES_COL_NAME = 'ClaimEntries';
exports.CONTACTS_COL_NAME = 'Contacts';
exports.BILL_COL_NAME = 'Bills';
exports.BILLING_ITEMS_COL_NAME = 'BillingItems';
exports.USERPROFILE_COL_NAME = 'UserProfiles';
exports.NOTIFICATIONS_COL_NAME = 'Notifications';
