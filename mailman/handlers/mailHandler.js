var models = require('007-claimman/models/models.js');
var dbtools = require('007-claimman/tools/dbtools.js');
var config = require('../config.js');

/* Topmost function to handle mail */
function handleMail(mail){
    var data = parseMail(mail);
    // create event/entry
    var entry = new models.ClaimEntry();
    entry.claimId = data.claimId;
    entry.mail = data.mail;
    console.log(entry);
    // write to db
    writeEntry(entry);
    // respond with email?
}

function writeEntry(entry){
    var connUrl = config.db;
    dbtools.run(connUrl, function(db){
        var entityCol = db.collection('ClaimEntries');
        entityCol.insert(entry, {w: 1}, function (err, result) {
            console.log('Saving entry ' + entry);
        });
    });
}

function parseMail(mail){
    var claimId = _getClaimId(mail);
    if (!claimId)
        throw 'No claimId found.'
    result = {'claimId': claimId,
              'mail': mail}
    return result
}

// Should this return null or throw when no id is found?
function _getClaimId(mail){
    var regex = RegExp('claim *id:[ \t]*([A-Za-z0-9_]+)', 'i');
    var claimid = mail.subject.match(regex);
    if (claimid && claimid.length > 1)
        return claimid[1]
}

exports._getClaimId = _getClaimId;
exports.parseMail = parseMail;
exports.handleMail = handleMail;
