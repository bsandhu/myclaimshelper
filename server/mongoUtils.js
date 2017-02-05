let MongoClient = require('mongodb').MongoClient;
let jQuery = require('jquery-deferred');
let config = require('./config.js');
let Consts = require('./shared/consts.js');
let _ = require('underscore');
let assert = require('assert');


let dbConn;

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
    let objs = _.isArray(objects) ? objects : [objects];
    let fn = function (obj) {
        return _.extend(new type(), obj)
    };
    let hydrated = _.map(objs, fn);
    return hydrated;
}

function initConnPool() {
    let deferred = jQuery.Deferred();
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
    let deferred = jQuery.Deferred();

    run(function (db) {
        let col = db.collection('Sequences');

        col.findAndModify(
            {_id: sequenceName},
            [
                ['_id', 1]
            ],
            {$inc: {seq: 1}},
            {upsert: true},
            {new: true},
            function onUpdate(err, doc) {
                if (err) {
                    console.error(err);
                    deferred.reject(err);
                    return;
                }
                console.log('Generated Seq number for: ' + sequenceName + '. ' + doc.value.seq);
                deferred.resolve(doc.value.seq);
            });
    });
    return deferred.promise();
}

function saveOrUpdateEntity(entity, colName, deleteIngroupsAttr = true) {
    console.log('saveOrUpdateEntity. ' + JSON.stringify(entity) + '. Collection name: ' + colName);
    checkOwnerPresent(entity.owner);
    checkGroupPresent(entity.group);
    if (deleteIngroupsAttr) {
        delete entity.inGroups;
        delete entity.ingroups;
    }

    let defer = jQuery.Deferred();

    function getSeqNum() {
        return incrementAndGet(colName);
    }

    function dbCall(seqNum) {
        run(function update(db) {
            let entityCol = db.collection(colName);
            if (!entity._id) {
                // Note: Ids are always Strings .. not numbers
                entity._id = String(seqNum);
                entityCol.insert(entity,
                    {w: 1},
                    function onInsert(err, results) {
                        console.log('Added to Mongo collection ' + colName + '. Id: ' + results.ops[0]._id);
                        defer.resolve(err, results.ops[0]);

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
    let defer = jQuery.Deferred();
    if (!entityId) {
        defer.reject("EntityId not specified");
    }

    run(function update(db) {
        let entityCol = db.collection(colName);
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

    let defer = jQuery.Deferred();
    run(function update(db) {
        let entityCol = db.collection(colName);
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
        assert(obj != null && obj != undefined, 'Owner attr must be present');
    } else {
        assert(obj.length > 0, 'Owner attr must be present');
    }
}
function checkGroupPresent(obj) {
    if (_.isObject(obj)) {
        assert(obj != null && obj != undefined, 'Group attr must be present');
    } else {
        assert(obj.length > 0, 'Group attr must be present');
    }
}

function checkInGroups(ingroups) {
    assert(_.isArray(ingroups) || _.isString(ingroups), 'ingroups attr must be present for search');
}

function toArray(ingroups) {
    return _.isArray(ingroups)
        ? ingroups
        : _.map(ingroups.split(','), x => x.trim());
}


function getEntityById(entityId, colName, owner, ingroups) {
    checkOwnerPresent(owner);
    checkInGroups(ingroups);
    let defer = jQuery.Deferred();

    run(function (db) {
        let entityCol = db.collection(colName);
        entityCol.findOne({'_id': entityId, $or: [{'owner': owner}, {'group': {$in: toArray(ingroups)}}]}, onResults);

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
    let defer = jQuery.Deferred();
    console.log('Delete ' + JSON.stringify(predicate) + ' . Col: ' + colName);

    run(function remove(db) {
        let entityCol = db.collection(colName);
        entityCol.remove(predicate,
            {w: 1},
            function onRemove(err, result) {
                if (err) {
                    defer.reject(err);
                } else {
                    console.log('Deleted');
                    defer.resolve();
                }
            });
    });
    return defer;
}

// :: None -> Promise
const connect = function () {
    let result = jQuery.Deferred();
    if (!dbConn) {
        MongoClient.connect(config.db, _.partial(_onResult, result));
    } else {
        result.resolve(dbConn);
    }
    return result;
}

// :: String -> Dict -> DB -> Promise
const findEntities = function (collectionName, search, db, checkOwner = true) {
    if (checkOwner) {
        console.info('Skipping ownership check for ' + collectionName);
        checkOwnerPresent(search.owner);
        checkInGroups(search.ingroups);
    }

    let result = jQuery.Deferred();
    let collection = db.collection(collectionName);

    // Make a copy
    search = _.assign({}, search);
    let owner = _.has(search, 'owner') ? search.owner : '';
    let ingroups = _.has(search, 'ingroups') ? search.ingroups : '';
    delete search.owner;
    delete search.group;
    delete search.ingroups;
    if (checkOwner) {
        let hasANDClause = search.hasOwnProperty('$and');
        let hasORClause = search.hasOwnProperty('$or');

        if (hasANDClause && hasORClause) {
            throw `Can\'t add ownership filter to this query ${JSON.stringify(search)}`;
        }
        else if (!hasANDClause && hasORClause) {
            search['$and'] = [];
            search['$and'].push({'$or': [{'owner': owner}, {'group': {$in: toArray(ingroups)}}]});
            search['$and'].push({'$or': search['$or']});
            delete search['$or'];
        } else {
            search['$or'] = [{'owner': owner}, {'group': {$in: toArray(ingroups)}}];
        }
    }

    console.log(`Search query: ${JSON.stringify(search)}`);
    collection
        .find(search)
        .toArray(function (err, resp) {
            _onResult(result, err, resp);
        });
    return result;
};

function addOwnerInfo(req, obj) {
    obj.owner = req.headers.userid;
    obj.group = req.headers.group;
    obj.ingroups = toArray(req.headers.ingroups);
    obj.ingroups.push(obj.group);
    return obj;
}

function initCollections() {
    initCollection('Bills');
    initCollection('BillingItems');
    initCollection('BillingProfiles');
    initCollection('Claims');
    initCollection('ClaimEntries');
    initCollection('Contacts');
    initCollection('Files');
    initCollection('Sequences');
    initCollection('UserProfiles');
    initCollection('Notifications');
    initCollection('RefData');
    initCollection('FormData');
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
exports.addOwnerInfo = addOwnerInfo;
exports.toArray = toArray;

exports.CLAIMS_COL_NAME = 'Claims';
exports.CLAIM_ENTRIES_COL_NAME = 'ClaimEntries';
exports.CONTACTS_COL_NAME = 'Contacts';
exports.BILL_COL_NAME = 'Bills';
exports.BILLING_ITEMS_COL_NAME = 'BillingItems';
exports.BILLING_PROFILE_COL_NAME = 'BillingProfiles';
exports.USERPROFILE_COL_NAME = 'UserProfiles';
exports.NOTIFICATIONS_COL_NAME = 'Notifications';
exports.ZIPCODES_COL_NAME = 'ZipCodes';
exports.REFDATA_COL_NAME = 'RefData';
exports.FORMDATA_COL_NAME = 'FormData';
