var jQuery = require('jquery-deferred');
var Mailgun = require('mailgun-js');
var _ = require('underscore');

var config = require('../../config.js');
var claimsService = require("../../services/claimsService.js");
var ClaimEntry = require("../../model/claimEntry.js");
var BillingItem = require('../../model/billingItem.js');
var MailParser = require('./mailParser.js').MailParser;
var saveToDB = require('../uploadService.js').saveToDB;
var mongoUtils = require('../../mongoUtils.js');
var Consts = require('./../../shared/consts.js');
var broadcastNoHTTP = require('../../services/notificationService.js').broadcastNoHTTP;

/**
 * Invoked by the Mailgun service
 */
var process = function (req, res) {
    res.send(200, 'Request received successfully.');
    var defer = jQuery.Deferred();

    var parser = new MailParser();
    jQuery.when(parser._getAllKnownClaims(), parser._getAllKnownUserIds())
        .then(function (allKnownClaims, allKnownUserIds) {

            var mailEntry = parser.parseRequest(req, allKnownClaims, allKnownUserIds);

            if (mailEntry.errors.length > 0) {
                notifyFailure(mailEntry);
                defer.reject(mailEntry);
            } else {
                mongoUtils.connect()
                    .then(_.partial(linkToParentClaim, mailEntry))
                    .then(saveAttachments)
                    .then(saveEntry)
                    .then(notifySuccess, notifyFailure)
                    .then(_.partial(defer.resolve))
                    .fail(_.partial(defer.reject));
            }
        })
    return defer;
};

var linkToParentClaim = function (mailEntry, db) {
    var defer = jQuery.Deferred();

    findParentClaim(mailEntry.claimId, db)
        .then(function onSuccess(claim) {
            mailEntry.claimId = claim._id;
            mailEntry.owner = claim.owner;
            defer.resolve(mailEntry);
        }, function onError(msg) {
            mailEntry.error = msg;
            defer.reject(mailEntry);
        });
    return defer;
}

var findParentClaim = function (insuranceId, db) {
    var r = jQuery.Deferred();

    findParentClaims(insuranceId, db)
        .then(function (claims) {
            if (claims.length < 1) {
                r.reject('No Claim found with Insurance Id ' + insuranceId);
            }
            // TODO
            //else if (claims.length > 1){
            //r.reject('Oh! more than one Claim found with Insurance Id' + insuranceId);
            //}
            else {
                r.resolve(claims[0]);
            }
        });
    return r;
};

var findParentClaims = function (insuranceId, db) {
    return mongoUtils.findEntities(
        mongoUtils.CLAIMS_COL_NAME,
        {insuranceCompanyFileNum: insuranceId},
        db,
        false);
};

var saveEntry = function (mailEntry) {
    entry = constructClaimEntry(mailEntry);
    attachments = mailEntry.attachments;

    for (var i = 0; i < attachments.length; i++) {
        var metadata = {
            id: attachments[i].id,
            name: attachments[i].name,
            size: attachments[i].size
        };
        entry.attachments.push(metadata);
    }
    var d = jQuery.Deferred();
    claimsService.saveOrUpdateClaimEntryObject(entry)
        .then(function (obj) {
            if (obj.status == 'Success') {
                mailEntry._id = obj.data._id;
                d.resolve(mailEntry);
            }
            // saveOrUpdateClaimEntryObject always returns 'resolved'
            // 'error' message is transmitted via 'status' flag.
            else {
                mailEntry.error = obj.details;
                d.reject(mailEntry);
            }
        });
    return d.promise();
};

// @returns ids of files saved to db.
var saveAttachment = function (attachment) {
    return saveToDB(attachment.name, attachment.path);
};

var saveAttachments = function (mailEntry) {
    var _success = function () {
        for (var i = 0; i < mailEntry.attachments.length; i++) {
            mailEntry.attachments[i].id = arguments[i];
        }
        return mailEntry;
    }

    var _failure = function (error) {
        mailEntry.error = error;
        return mailEntry;
    }

    var x = jQuery.when.apply(null, mailEntry.attachments.map(saveAttachment));
    return x.then(_success, _failure);
};

var notifySuccess = function (mailEntry) {
    broadcastNoHTTP(
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.INFO,
        'Email processed. ' + mailEntry.mail.subject + '  <a href="#/claimEntry/' + mailEntry.claimId + '/' + mailEntry._id + '">Goto task</a>',
        mailEntry.owner)
        .always(function email() {
            var body = 'Email processed successfully!';
            body += '\n\n' + JSON.stringify(mailEntry);
            sendEmail(mailEntry.mail.from, mailEntry.mail.subject, body);
        });
    return mailEntry;
};

var notifyFailure = function (mailEntry) {
    var err = 'ERROR processing email:';
    var body = err + mailEntry.mail.subject + '<br/>Details: ' + JSON.stringify(mailEntry.errors[0]);

    var notifyFn = _.partial(broadcastNoHTTP,
                        Consts.NotificationName.NEW_MSG,
                        Consts.NotificationType.ERROR,
                        body,
                        mailEntry.owner);

    var sendMailFn = _.partial(sendEmail,
                            mailEntry.mail.from,
                            mailEntry.mail.subject,
                            body);
    mailEntry.owner
        ? notifyFn().then(sendMailFn)
        : sendMailFn();
    return mailEntry;
};

// **** Helpers ****

function constructClaimEntry(data) {
    var entry = new ClaimEntry();
    entry.entryDate = (new Date()).getTime();
    entry.summary = data.mail.subject;
    entry.from = data.mail.from;
    entry.description = data.mail['body-plain'];
    entry.claimId = data.claimId;
    entry.tag = data.tags || [];
    entry.tag.push('email');
    entry.owner = data.owner;

    entry.billingItem = new BillingItem();
    return entry;
}

function sendEmail(recipient, subject, body) {
    var mailgun = new Mailgun({apiKey: config.mailgun.api_key,
        domain: config.mailgun.domain});
    var data = {
        from: 'Agent 007 <no-reply@007.com>',
        to: recipient,
        subject: subject,
        text: body
    };
    mailgun.messages().send(data, function (error, body) {
        console.log(data);
        if (error) {
            console.log(error);
            throw error;
        }
        else console.log('Mail sent successfully: ' + JSON.stringify(body));
    });
}

exports.process = process;
