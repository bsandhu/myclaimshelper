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
        if (!userId) {
            errors.push('User ' + req.params.To.split('@')[0] + ' is not registered with the MyClaimsHelper.com');
        }

        // Match claim
        if (userId) {
            var claimId = this._getClaimId(req.params.subject, allKnownClaims, userId);
            if (!claimId) {
                errors.push('Could not find a matching claim. Plase ensure that the subject line of the email has the Claim file number');
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
        'owner': userId,
        'attachments': attachments,
        'tags': tags,
        'mail': req.params,
        'errors': errors};
};

/**
 * Gets all known Insurance file number from the DB and cached in MailParser.allClaimsByOwner
 */
MailParser.prototype._getAllKnownClaims = function () {
    var defer = jQuery.Deferred();
    mongoUtils
        .connect()
        .then(function (db) {
            db.collection(mongoUtils.CLAIMS_COL_NAME)
                .find({}, {insuranceCompanyFileNum: 1, owner: 1})
                .toArray(function (err, docs) {
                    if (err) {
                        defer.reject(err);
                    } else {
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

    return _.find(allUserIds, function (userId) {
        return userId.toUpperCase() === incomingUserId.toUpperCase();
    });
}

MailParser.prototype._getClaimId = function (subject, allClaimsByOwner, owner) {
    assert(owner, 'Must specify owner');
    var tokens = subject.split(' ');
    var claimId = null;

    _.each(tokens, function (token) {
        _.each(allClaimsByOwner, function (claimByOwner) {
            if (claimByOwner.insuranceCompanyFileNum == token && claimByOwner.owner == owner) {
                claimId = token;
            }
        })
    });
    return claimId;
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
