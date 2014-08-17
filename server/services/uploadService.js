var assert = require('assert');
var mongoUtils = require('./../mongoUtils.js');
var GridStore = require('mongodb').GridStore;
var jQuery = require('jquery-deferred');

/**
 *  The uploaded file is in the form of multi part form data
 *  `Restify` parses uploaded file into a files parameter.
 *  It uses 'Fomidable' internally, so no need to do so manually
 */
function uploadArtifact(req, res) {
    assert.ok(req.files.uploadedFile, 'Expecting uploadedFile as a parameter');

    var file = req.files.uploadedFile;
    console.info('Got file: ' + file.name + ', ' + file.path);

    saveToDB(file.name, file.path)
        .done(function(seqNum){
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('Uploaded. Id ' + seqNum);
            res.end();
        })
        .fail(function(){
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
            gridStore.open(function(err, gridStore) {

                // Write some data to the file
                gridStore.writeFile(filePath, function(err, gridStore) {
                    if (err) {
                        saveDeferred.reject(err);
                        return;
                    }
                    // Close (Flushes the data to MongoDB)
                    gridStore.close(function(err, result) {
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
        var gridStore = new GridStore(db, _id, fileName, "r");
        var gotEnd = false;

        gridStore.open(function(err, gridStore) {

            gridStore.open(function(err, gs) {

                // Create a stream to the file
                var stream = gs.stream(true);

                stream.on("end", function() {
                    gotEnd = true;
                });

                stream.on("close", function() {
                    assert.ok(gotEnd);
                    db.close();
                });
                defer.resolve(stream);
            });
        });
    });
    return defer;
}

exports.uploadArtifact = uploadArtifact;
exports.saveToDB = saveToDB;
exports.readFromDB = readFromDB;