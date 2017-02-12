let assert = require('assert');
let mongoUtils = require('./../mongoUtils.js');
let ObjectUtils = require('./../shared/objectUtils.js');
let FileMetadata = require('./../model/fileMetadata.js');
let GridStore = require('mongodb').GridStore;
let jQuery = require('jquery-deferred');

/**
 *  The uploaded file is in the form of multi part form data
 *  `Restify` parses uploaded file into a files parameter.
 *  It uses 'Fomidable' internally, so no need to do so manually
 */
function uploadFile(req, res) {
    assert.ok(req.files.uploadedFile, 'Expecting uploadedFile as a parameter');
    assert.ok(req.headers.userid, 'Expecting userid in the req header');

    let file = req.files.uploadedFile;
    let fileName = req.params.fileName;
    let fileType = ObjectUtils.defaultValue(fileName.split('.')[1], '');
    console.info('Got file: ' + fileName + ', ' + file.path);

    saveToDB(fileName, file.path)
        .done(function okResponse(seqNum) {
            let fileMetadata = new FileMetadata();
            fileMetadata.id = seqNum;
            fileMetadata.name = fileName;
            fileMetadata.size = file.size;
            fileMetadata.lastModifiedDate = req.params.lastModifiedDate;
            fileMetadata.type = fileType;

            mongoUtils.addOwnerInfo(req, fileMetadata);

            console.log('Processed file. Metadata: ' + JSON.stringify(fileMetadata));
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(fileMetadata));
        })
        .fail(function errResponse() {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write('Error');
            res.end();
        });
}

function downloadFile(req, res) {
    let id = Number(req.params.id);

    jQuery
        .when(getFileMetadata(id), readFromDB(id))
        .done(streamFileToClient)
        .fail(function (err) {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write('Error');
            res.end();
        });

    function streamFileToClient(fileMeta, stream) {
        res.writeHead(200, {
            'Content-type': fileMeta.contentType,
            'Content-Disposition': 'attachment; filename="' + fileMeta.filename + '"'
        });
        stream.on('data',
            function sendToClient(chunk) {
                res.write(chunk);
            }
        );
        stream.on('end', function () {
            res.end();
        });
    }
}

/******************************************************/
/* Mongo GridFS operations                            */
/* See http://docs.mongodb.org/manual/core/gridfs/    */
/******************************************************/

function saveToDB(fileName, filePath) {
    let saveDeferred = jQuery.Deferred();

    function getSeqNum() {
        return mongoUtils.incrementAndGet('Files');
    }

    function save(seqNum) {
        mongoUtils.run(function (db) {
            let gridStore = new GridStore(db, seqNum, fileName, "w+");

            // Open the file
            gridStore.open(function (err, gridStore) {

                // Write some data to the file
                gridStore.writeFile(filePath, function (err, gridStore) {
                    if (err) {
                        saveDeferred.reject(err);
                        return;
                    }
                    // Close (Flushes the data to MongoDB)
                    gridStore.close(function (err, result) {
                        if (err) {
                            saveDeferred.reject(err);
                            return;
                        }
                        console.log('Uploaded ' + fileName + ' to GridFS');
                        saveDeferred.resolve(seqNum);
                    });
                });
            });

        });
    }

    getSeqNum().then(save).done();
    return saveDeferred;
}

/**
 * @param _id of the saved file
 * @param fileName
 * @returns Stream representing the file being read
 * @see uploadServiceTest.js
 */
function readFromDB(_id) {
    let defer = jQuery.Deferred();

    mongoUtils.run(function (db) {
        let gridStore = new GridStore(db, _id, '', "r");
        let gotEnd = false;

        gridStore.open(function (err, gs) {
            if (err) {
                defer.reject(err);
            }

            // Create a stream to the file
            let stream = gs.stream(true);

            stream.on("end", function () {
                gotEnd = true;
            });

            stream.on("close", function () {
                assert.ok(gotEnd);
            });
            defer.resolve(stream);
        });
    });
    return defer;
}

/*
 * @returns MetaData document for the file from the GirdFS `fs.files` collection
 */
function getFileMetadata(id) {
    let defer = jQuery.Deferred();

    mongoUtils.run(function (db) {
        var col = db.collection('fs.files');
        col.findOne({'_id': id}, function (err, item) {
            if (err) {
                console.error(err);
                defer.reject(err);
            }
            defer.resolve(item);
        });
    });
    return defer;
}


exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.saveToDB = saveToDB;
exports.readFromDB = readFromDB;
