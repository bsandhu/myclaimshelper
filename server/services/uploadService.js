var assert = require('assert');
var mongoUtils = require('./../mongoUtils.js');
var GridStore = require('mongodb').GridStore;
var jQuery = require('jquery-deferred');

/**
 *  The uploaded file is in the form of multi part form data
 *  `Restify` parses uploaded file into a files parameter.
 *  It uses 'Fomidable' internally, so no need to do so manually
 */
function uploadFile(req, res) {
    assert.ok(req.files.uploadedFile, 'Expecting uploadedFile as a parameter');

    var file = req.files.uploadedFile;
    console.info('Got file: ' + file.name + ', ' + file.path);

    saveToDB(file.name, file.path)
        .done(function okResponse(seqNum) {
            var fileMetadata = {
               id   : seqNum,
               name : file.name,
               size : file.size
            };
            console.log('Processes file. Metadata: ' + JSON.stringify(fileMetadata));
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
    var id = Number(req.params.id);

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
    var saveDeferred = jQuery.Deferred();

    function getSeqNum() {
        return mongoUtils.incrementAndGet('Files');
    }

    function save(seqNum) {
        mongoUtils.run(function (db) {
            var gridStore = new GridStore(db, seqNum, fileName, "w+");

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
    var defer = jQuery.Deferred();

    mongoUtils.run(function (db) {
        var gridStore = new GridStore(db, _id, '', "r");
        var gotEnd = false;

        gridStore.open(function (err, gs) {
            if (err) {
                defer.reject(err);
            }

            // Create a stream to the file
            var stream = gs.stream(true);

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
    var defer = jQuery.Deferred();

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
