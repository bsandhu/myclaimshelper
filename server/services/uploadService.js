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
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('Uploaded. Id ' + seqNum);
            res.end();
        })
        .fail(function errResponse() {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write('Error');
            res.end();
        });
}

function downloadFile(req, res) {
    var id = req.params.id;
    var fileName = req.params.fileName;

    readFromDB(id, fileName)
        .done(function (stream) {
            res.writeHead(200, {
                'Content-type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="' + fileName + '"'
            });

            stream.on('data',
                function sendToClient(chunk) {
                    res.write(chunk);
                }
            );

            stream.on('end', function () {
                res.end();
            });
        })
        .fail(function(err){
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write('Error');
            res.end();
        });
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
                        db.close();
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
function readFromDB(_id, fileName) {
    var defer = jQuery.Deferred();

    mongoUtils.run(function (db) {
        var gridStore = new GridStore(db, Number(_id), fileName, "r");
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
                db.close();
            });
            defer.resolve(stream);
        });
    });
    return defer;
}

exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.saveToDB = saveToDB;
exports.readFromDB = readFromDB;
