var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mongoUtils = require('../../mongoUtils.js');
var jQuery = require('jquery-deferred');
var _ = require('underscore');


function MailParser() {
    this.errors = [];
    this.allIds = [];
}

util.inherits(MailParser, EventEmitter);

MailParser.prototype.parseRequest = function (req) {
    //if (!claimId) this.emit('error', new Error('ClaimId not found'));
    try {
        var claimId = this._getClaimId(req.params.subject);
        if (!claimId) this.errors.push(new Error('ClaimId not found'));
        var attachments = this._getEmbeddedAttachmentInfo(req);
        var tags = this._getTags(req.params['body-plain']);
    }
    catch (e) {
        this.errors.push(e);
    }
    return {'claimId': claimId,
        'attachments': attachments,
        'tags': tags,
        'mail': req.params,
        'error': this.errors};
};

MailParser.prototype._getAllKnownClaimIds = function (subject) {
    var _this = this;
    var defer = jQuery.Deferred();
    mongoUtils
        .connect()
        .then(function (db) {
            db.collection(mongoUtils.CLAIMS_COL_NAME)
                .find({}, {insuranceCompanyFileNum: 1})
                .toArray(function (err, docs) {
                    if (err) {
                        defer.reject(err);
                    } else {
                        _this.allIds = _.map(docs, function (x) {
                            return x.insuranceCompanyFileNum;
                        });
                        defer.resolve(_this.allIds);
                    }
                });
        })
        .fail(_.partial(defer.reject));
    return defer;

}

MailParser.prototype._getClaimId = function (subject) {
    var tokens = subject.split(' ');
    var claimId = null;
    var _this = this;

    _.each(tokens, function (token) {
        if (_.contains(_this.allIds, token)) {
            claimId = token;
        }
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
