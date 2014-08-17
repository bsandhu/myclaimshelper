var assert = require('assert');
var path = require('path');
var uploadService = require('./../../server/services/uploadService.js');


describe('Upload Service', function () {

    var fileId;
    var FILE_NAME = 'testUpload.png';

    it('Save file to DB', function (done) {

        uploadService
            .saveToDB(FILE_NAME, path.resolve(__dirname, '../services/testData/testUpload.png'))
            .then(function (seqNum) {
                assert.ok(seqNum >= 0, 'Expectng seqNum on successful save');
                fileId = seqNum;
                done();
            });
    });

    it('Save fail', function (done) {
        uploadService
            .saveToDB('testUpload.png', 'badPath')
            .fail(function (err) {
                assert.ok(err);
                done();
            });
    });

    it('Read file from DB', function (done) {
        uploadService.readFromDB(fileId, FILE_NAME)
            .done(function (stream) {
                stream.on('data', function (chunk) {
                    assert.ok(chunk);
                    assert.ok(chunk.length > 0);
                    console.log('Read .. ' + chunk.length);
                });
                stream.on('end', function () {
                    done();
                });
            });
    });
});
