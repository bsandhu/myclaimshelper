var EventEmitter = require('events').EventEmitter;
var util = require('util');

function MailParser(){
    this.errors = [];
}

util.inherits(MailParser, EventEmitter);

MailParser.prototype.parseRequest = function(req){
    //if (!claimId) this.emit('error', new Error('ClaimId not found'));
    var claimId = this._getClaimId(req.params.subject);
    if (!claimId) this.errors.push(new Error('ClaimId not found'));
    var attachments = this._getEmbeddedAttachmentInfo(req);
    var tags = this._getTags(req.params['body-plain']);
    return {'claimId': claimId,
            'attachments': attachments,
            'tags': tags,
            'mail': req.params};
};

/*
 * @param {string} 
*/
MailParser.prototype._getClaimId = function(subject) {
    var regex = RegExp('claim *id:[ \t]*([A-Za-z0-9_]+)', 'i');
    var claimid = subject.match(regex);
    if (claimid && claimid.length > 1)
        return claimid[1];
};

/*
 * Emails can be tagged arbitrarily. Tags start wtih # and can be found in the
 * body of the text.
*/
MailParser.prototype._getTags = function(body) {
    var regex = RegExp('#[A-Za-z0-9_]+', 'g');
    var tags = body.match(regex);
    return tags;
};

/*
 * @param {http request}
 */
MailParser.prototype._getEmbeddedAttachmentInfo = function(req) {
    var attachments = [];
    for (var i=1; i <= req.params['attachment-count']; i++){
        attachments.push(req.files['attachment-' + i]);
    }
    console.log('Attachments:');
    console.log(JSON.stringify(attachments));
    return attachments;
};


exports.MailParser = MailParser
