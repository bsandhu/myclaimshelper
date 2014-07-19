var models = require('007-claimman/models/models.js');
var dbtools = require('007-claimman/tools/dbtools.js');
var config = require('../config.js');

/*
 * Define an action pipeline that is easily editable
 */

/* 
 * Topmost function to handle mail 
 *
 * @param {object} pre-parsed structured mail object.
 * @returns status object?
 */
function handleMail(mail){
    var data = parseMail(mail);
    // write email to db
    writeEntry(data, 'ClaimEntries');
    // write attachments
    // writeEntry(data, 'Artifacts');
    // respond with email?
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

function parseMail(mail){
    var claimId = _getClaimId(mail);
    if (!claimId)
        throw 'No claimId found.'
    result = {'claimId': claimId,
              'mail': mail}
    return result
}

/*
 * @param {object} pre-parsed structured mail object.
 *
 * NOTE: Should this return null or throw when no id is found?
*/
function _getClaimId(mail){
    var regex = RegExp('claim *id:[ \t]*([A-Za-z0-9_]+)', 'i');
    var claimid = mail.subject.match(regex);
    if (claimid && claimid.length > 1)
        return claimid[1]
}

exports._getClaimId = _getClaimId;
exports.parseMail = parseMail;
exports.handleMail = handleMail;
