var models = require('007-claimman/models/models.js');
var dbtools = require('007-claimman/tools/dbtools.js');
var config = require('../config.js');

/*
 * Define an action pipeline that is easily editable
 */

/* 
 * Topmost function to handle mail 
 */
function processMailRequest(req, res, next){
    var mailEntry = parseMailRequest(req);
    //writeEntry({'attachments': attachments}, 'ClaimEntries');
    res.send(200, 'Request Processed.');
    next();
}

function parseMailRequest(req){
    var claimId = _getClaimId(req.params.subject);
    var attachments = _getEmbeddedAttachmentInfo(req);
    var tags = _getTags(req.params['body-plain'])
    result = {'claimId': claimId,
              'attachments': attachments,
              'tags': tags,
              'mail': req.params}
    return result
}

function _getEmbeddedAttachmentInfo(req){
    var attachments = [];
    for (var i=1; i <= req.params['attachment-count']; i++){
        attachments.push(req.files['attachment-' + i]);
    }
    console.log('Attachments:');
    console.log(JSON.stringify(attachments));
    return attachments
}

/*
 * @param {object} pre-parsed structured mail object.
 *
*/
function _getClaimId(subject){
    var regex = RegExp('claim *id:[ \t]*([A-Za-z0-9_]+)', 'i');
    var claimid = subject.match(regex);
    if (claimid && claimid.length > 1)
        return claimid[1]
    else throw 'Claim ID not found!'
}

/*
 * Emails can be tagged arbitrarily. Tags start wtih # and can be found in the
 * body of the text.
*/
function _getTags(body){
    var regex = RegExp('#[A-Za-z0-9_]+', 'g');
    var tags = body.match(regex);
    return tags
}

function writeEntry(entry, collectionName){
    var connUrl = config.db;
    dbtools.run(connUrl, function(db){
        var entityCol = db.collection(collectionName);
        entityCol.insert(entry, {w: 1}, function (err, result) {
            if (err) throw err;
            console.log('Saved entry ' + entry);
        });
    });
}

exports._getClaimId = _getClaimId;
exports._getTags = _getTags;
exports.parseMailRequest = parseMailRequest;
exports.processMailRequest = processMailRequest;
