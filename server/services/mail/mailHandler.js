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


var process = function (req, res) {
    res.send(200, 'Request received successfully.');
    var defer = jQuery.Deferred();
    var parser = new MailParser();

    parser
        ._getAllKnownClaimIds()
        .then(function(){
            var mailEntry = parser.parseRequest(req);
            if (parser.errors.length > 0) {
                notifyFailure(mailEntry);
                defer.reject(mailEntry);
            } else {
                mongoUtils.connect()
                    .then(_.partial(checkClaim, mailEntry))
                    .then(saveAttachments)
                    .then(saveEntry)
                    .then(notifySuccess, notifyFailure)
                    .then(_.partial(defer.resolve))
                    .fail(_.partial(defer.reject));
            }
        })
    return defer;
};

var checkClaim = function (mailEntry, db) {
    var defer = jQuery.Deferred();
    var updateId = function (claimId) {
        mailEntry.claimId = claimId;
        defer.resolve(mailEntry);
    }
    var error = function (msg) {
        mailEntry.error = msg;
        defer.reject(mailEntry);
    }

    findParentClaimId(mailEntry.claimId, db)
        .then(updateId, error);
    return defer;
}

var findParentClaimId = function (insuranceId, db) {
    var r = jQuery.Deferred();
    var _getId = function (claims) {
        if (claims.length < 1) {
            r.reject('No Claim found with Insurance Id ' + insuranceId);
        }
        //else if (claims.length > 1){
        //r.reject('Oh! more than one Claim found with Insurance Id' + insuranceId);
        //}
        else {
            r.resolve(claims[0]._id);
        }
    };
    findParentClaims(insuranceId, db)
        .then(_getId);
    return r;
};

var findParentClaims = function (insuranceId, db) {
    return mongoUtils.findEntities(mongoUtils.CLAIMS_COL_NAME,
        {insuranceCompanyFileNum: insuranceId},
        db);
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
            'Email processed. ' + mailEntry.mail.subject + '  <a href="#/claimEntry/' + mailEntry.claimId + '/' + mailEntry._id + '">Goto task</a>')
        .always(function doit() {
            var body = 'Email processed successfully!';
            body += '\n\n' + JSON.stringify(mailEntry);
            sendEmail(mailEntry.mail.from, mailEntry.mail.subject, body);
        });
    return mailEntry;
};

var notifyFailure = function (mailEntry) {
    var err = 'ERROR processing email:';
    var body = err + mailEntry.mail.subject + '<br/>Details: ' + JSON.stringify(mailEntry.error);
    broadcastNoHTTP(
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.ERROR,
        body)
        .always(function doit() {
            sendEmail(mailEntry.mail.from, mailEntry.mail.subject, body);
        });
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
            concole.log(error);
            throw error;
        }
        else console.log('Mail sent successfully: ' + JSON.stringify(body));
    });
}

exports.process = process;
