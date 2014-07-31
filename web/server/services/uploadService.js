var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    os = require('os');

/**
 *  Handle file upload using the formidable lib
 *  https://github.com/felixge/node-formidable
 */
function uploadArtifact(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = os.tmpdir();
    form.keepExtensions = true;
    console.log('Uploading to ' + form.uploadDir);

    // Emitted when the upload is complete
    // TODO Push into MongoDB from file system
    form.on('file', function(name, file) {
        console.info('Got file: ' + file.name + ',' + file.path);
    });
    form.on('end', function () {
        console.info('Finished uploading file');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end();
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        console.info('Received: ' + bytesReceived + ' bytes');
    });
    form.on('error', function (err) {
        console.error('Error while uploading file: ' + err);
        res.writeHead(500, {'content-type': 'text/plain'});
        res.end('Error while uploading file');
    });

    form.parse(req);
}

exports.uploadArtifact = uploadArtifact;