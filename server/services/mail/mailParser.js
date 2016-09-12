var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mongoUtils = require('../../mongoUtils.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');
var assert = require('assert');


function MailParser() {
}

util.inherits(MailParser, EventEmitter);

MailParser.prototype.parseRequest = function (req, allKnownClaims, allKnownUserIds) {
    try {
        allKnownClaims = allKnownClaims || [];
        allKnownUserIds = allKnownUserIds || [];
        var errors = [];

        // Match user
        var userId = this._getUserId(req.params.To, allKnownUserIds);
        console.log('Incoming user Id: ' + userId);
        if (!userId) {
            errors.push('User <i>' + req.params.To.split('@')[0] + '</i> is not registered with the MyClaimsHelper.com');
        } else {
            console.log('Incoming user Id ' + userId + ' found in system');
        }

        // Match claim
        if (userId) {
            var matchInfo = this._getClaimId(req.params.subject, allKnownClaims, userId);
            var claimId = matchInfo[0];
            var fileNum = matchInfo[1];
            if (!claimId) {
                console.log('Failed to match to known claim');
                try {
                    var firstKnownClaimId = allKnownClaims[0]['insuranceCompanyFileNum'] || allKnownClaims[0]['fileNum'];
                    firstKnownClaimId = firstKnownClaimId || '04-92998';
                } catch (e) {
                    var firstKnownClaimId = '04-92998';
                }

                errors.push('Could not find a Claim to add this task to. ' +
                    'Please ensure that the subject line of the email has the Claim file number.' +
                    '<br/>' +
                    '<br/>' +
                    'The subject line should look something like this' +
                    '<br/>' +
                    '<i>Meet attorney at court ' + firstKnownClaimId + '</i>');
            }
        }

        // More parsing
        var attachments = this._getEmbeddedAttachmentInfo(req);
        var tags = this._getTags(req.params['body-plain']);
    } catch (e) {
        errors.push(e);
    }
    return {
        'claimId': claimId,
        'fileNum': fileNum,
        'owner': userId,
        'attachments': attachments,
        'tags': tags,
        'mail': req.params,
        'errors': errors
    };
};

/**
 * Gets all known Insurance file number from the DB and cached in MailParser.allClaimsByOwner
 */
MailParser.prototype._getAllKnownClaims = function (owner) {
    assert.ok(owner, 'Expecting owner param');
    console.log('Get all known claims for user: ' + owner);
    var defer = jQuery.Deferred();
    mongoUtils
        .connect()
        .then(function (db) {
            var ignoreCaseRegex = new RegExp(["^", owner, "$"].join(""), "i");
            db.collection(mongoUtils.CLAIMS_COL_NAME)
                .find({owner: ignoreCaseRegex}, {fileNum: 1, insuranceCompanyFileNum: 1, owner: 1, _id: 1})
                .toArray(function (err, docs) {
                    if (err) {
                        defer.reject(err);
                    } else {
                        console.log(docs.length + ' known claims for ' + owner);
                        console.log(docs);
                        defer.resolve(docs);
                    }
                });
        })
        .fail(_.partial(defer.reject));
    return defer;
};

MailParser.prototype._getAllKnownUserIds = function () {
    var defer = jQuery.Deferred();
    mongoUtils
        .connect()
        .then(function (db) {
            db.collection(mongoUtils.USERPROFILE_COL_NAME)
                .find({}, {_id: 1})
                .toArray(function (err, docs) {
                    if (err) {
                        defer.reject(err);
                    } else {
                        var allUserIds = _.map(docs, function (x) {
                            return x._id;
                        });
                        console.log(allUserIds.length + ' known users');
                        defer.resolve(allUserIds);
                    }
                });
        })
        .fail(_.partial(defer.reject));
    return defer;
};

/**
 * Sender email expected to be of the form: foo@myclaimshelper.com
 */
MailParser.prototype._getUserId = function (senderEmail, allUserIds) {
    var incomingUserId = senderEmail.split('@')[0];

    // Remove any spurious quotes around email addr
    incomingUserId = incomingUserId.replace('"', '');
    incomingUserId = incomingUserId.replace("'", '');

    return _.find(allUserIds, function (userId) {
        return userId.toUpperCase() === incomingUserId.toUpperCase();
    });
}

MailParser.prototype._getClaimId = function (subject, allClaimsByOwner, owner) {
    assert(owner, 'Must specify owner');
    console.log('Matching known claims to subject: ' + subject);
    var tokens = subject.split(' ');
    var claimId = null;
    var fileNum = null;

    _.each(tokens, function (token) {
        token = token.trim();
        token = token.replace('"', '');
        token = token.replace("'", '');
        console.log('Inspecting email subject token: >' + token + '<');

        _.each(allClaimsByOwner, function (claimByOwner) {
            // Note: owner is filtered out by mongo query
            var insuranceCoOnClaim = claimByOwner.insuranceCompanyFileNum
                ? claimByOwner.insuranceCompanyFileNum.trim()
                : claimByOwner.insuranceCompanyFileNum;

            var fileNumOnClaim = claimByOwner.fileNum
                ? claimByOwner.fileNum.trim()
                : claimByOwner.fileNum;

            if (String(insuranceCoOnClaim) == String(token) || String(fileNumOnClaim) == String(token)) {
                claimId = claimByOwner._id;
                fileNum = claimByOwner.fileNum || claimByOwner.insuranceCompanyFileNum;
                console.log('Matched claim: ' + JSON.stringify(claimByOwner));
            }
        })
    });
    return [claimId, fileNum];
};

/*
 * Emails can be tagged arbitrarily. Tags start wtih # and can be found in the
 * body of the text.
 */
MailParser.prototype._getTags = function (body) {
    var regex = RegExp('#[A-Za-z0-9_]+', 'g');
    var tags = body.match(regex);
    return tags;
};

/*
 * @param {http request}
 */
MailParser.prototype._getEmbeddedAttachmentInfo = function (req) {
    var attachments = [];
    for (var i = 1; i <= req.params['attachment-count']; i++) {
        attachments.push(req.files['attachment-' + i]);
    }
    console.log('Attachments:');
    console.log(JSON.stringify(attachments));
    return attachments;
};


exports.MailParser = MailParser
