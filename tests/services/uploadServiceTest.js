let assert = require('assert');
let path = require('path');
let uploadService = require('./../../server/services/uploadService.js');


describe('Upload Service', function () {

    let fileId;
    let FILE_NAME = 'testUpload.png';

    it('Save file to DB', function (done) {
        uploadService
            .saveToDB(FILE_NAME, path.resolve(__dirname, '../services/testData/testUpload.png'))
            .then(function (seqNum) {
                assert.ok(seqNum >= 0, 'Expecting seqNum on successful save');
                fileId = seqNum;
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

    it('Download file', function (done) {
        let req = {params: {id: fileId, fileName: FILE_NAME}};
        let res = {};
        res.writeHead = function () {};
        res.write = function (chunk) {
            assert.ok(chunk);
        };
        res.end = function () {
            done();
        };
        uploadService.downloadFile(req, res);
    });
});
