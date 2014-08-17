var assert = require('assert');

/**
 *  The uploaded file is in the form of multi part form data
 *  `Restify` parses uploaded file into a files parameter.
 *  It uses 'Fomidable' internally, so no need to do so manually
 */
function uploadArtifact(req, res) {
    assert.ok(req.files.uploadedFile, 'Expecting uploadedFile as a parameter');

    var file = req.files.uploadedFile;
    console.info('Got file: ' + file.name + ', ' + file.path);

    //TODO Write to Mongo
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('Uploaded');
    res.end();
}

exports.uploadArtifact = uploadArtifact;