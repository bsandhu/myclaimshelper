var jQuery = require('jquery-deferred');
var Mailgun = require('mailgun-js');
var _ = require('underscore');
var lodash = require('lodash');

var config = require('../../config.js');
var claimsService = require("../../services/claimsService.js");
var ClaimEntry = require("../../model/claimEntry.js");
var BillingItem = require('../../model/billingItem.js');
var States = require('../../model/states.js');
var MailParser = require('./mailParser.js').MailParser;
var saveToDB = require('../uploadService.js').saveToDB;
var mongoUtils = require('../../mongoUtils.js');
var DateUtils = require('../../shared/dateUtils.js');
var Consts = require('./../../shared/consts.js');
var broadcastNoHTTP = require('../../services/notificationService.js').broadcastNoHTTP;

/**
 * Invoked by the Mailgun service
 */
var process = function (req, res, testMode) {
    res.send(200, 'Request received successfully.');

    if (_.isBoolean(testMode) && testMode == true) {
        var sendSuccessEmail = false
        var sendErrorEmail = false;
    } else {
        var sendSuccessEmail = config.send_success_email_reply;
        var sendErrorEmail = config.send_failure_email_reply;
    }
    var from = req.params.To.toUpperCase().split('@')[0];
    var defer = jQuery.Deferred();

    var isTestUser = ['TESTUSER1', 'TESTUSER2'].indexOf(from) >= 0;
    console.log('Incoming req to MailHandler: ' + JSON.stringify(req.params));

    // Filter msgs accrding to ENV
    if (config.env === config.ENV_TEST && !isTestUser) {
        console.log('TEST env will only process test users. Skipping.');
        defer.reject();
        return defer;
    }
    else if (config.env === config.ENV_PROD && isTestUser) {
        console.log('PROD env will NOT process test users. Skipping.');
        defer.reject();
        return defer;
    }

    var parser = new MailParser();
    jQuery.when(parser._getAllKnownClaims(from), parser._getAllKnownUserIds())
        .then(function (allKnownClaims, allKnownUserIds) {

            var mailEntry = parser.parseRequest(req, allKnownClaims, allKnownUserIds);

            if (mailEntry.errors.length > 0) {
                notifyFailure(sendErrorEmail, mailEntry);
                defer.reject(mailEntry);
            } else {
                mongoUtils.connect()
                    .then(_.partial(saveAttachments, mailEntry))
                    .then(saveEntry)
                    .then(_.partial(notifySuccess, sendSuccessEmail), _.partial(notifyFailure, sendErrorEmail))
                    .then(_.partial(defer.resolve))
                    .fail(_.partial(defer.reject));
            }
        })
    return defer;
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

var notifySuccess = function (sendEmail, mailEntry) {
    broadcastNoHTTP(
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.INFO,
        'Email processed. ' + mailEntry.mail.subject + '  <a href="#/claimEntry/' + mailEntry.claimId + '/' + mailEntry._id + '">Goto task</a>',
        mailEntry.owner)
        .always(function email() {
            if (sendEmail) {
                var header = 'Email <i>' + mailEntry.mail.subject + '</i> processed';
                var body = JSON.stringify(mailEntry);
                sendEmailViaMailgun(mailEntry.mail.from, mailEntry.mail.subject, header, body);
            }
        });
    return mailEntry;
};

var notifyFailure = function (sendEmail, mailEntry) {
    var header = 'Failed to process this email <i>' + mailEntry.mail.subject + '</i>';
    var body = JSON.stringify(mailEntry.errors[0]) || 'There was a problem on our server. Apologies.';

    var notifyFn = _.partial(broadcastNoHTTP,
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.ERROR,
        header,
        mailEntry.owner);

    if (mailEntry.owner) {
        notifyFn();
    }
    if (sendEmail) {
        sendEmailViaMailgun(mailEntry.mail.from, mailEntry.mail.subject, header, body);
    }
    return mailEntry;
};

// **** Helpers ****

function constructClaimEntry(data) {
    var entry = new ClaimEntry();
    entry.entryDate = (new Date()).getTime();
    entry.dueDate = (DateUtils.startOfToday()).getTime();
    entry.updateDate = (new Date()).getTime();
    entry.summary = data.mail.subject;
    entry.from = data.mail.from;
    entry.description = data.mail['body-html'];
    entry.claimId = data.claimId;
    entry.tag = data.tags || [];
    entry.tag.push('email');
    entry.state = States.TODO;
    entry.owner = data.owner;

    // Service does the linking to the ClaimEntry
    entry.billingItem = new BillingItem();
    return entry;
}

function sendEmailViaMailgun(recipient, subject, header, body) {
    if (config.ev === config.ENV_LOCAL) {
        console.log('')
        return;
    }

    var compiled = _.template(emailTemplate);
    header = lodash.trim(header, '"');
    body = lodash.trim(body, '"');
    var htmlBody = compiled({header : header, body: body});

    var mailgun = new Mailgun({
        apiKey: config.mailgun.api_key,
        domain: config.mailgun.domain});
    var data = {
        from: 'MyClaimsHelper <no-reply@myclaimshelper.com>',
        to: recipient,
        subject: subject,
        html: htmlBody
    };
    mailgun.messages().send(data, function (error, body) {
        console.log(data);
        if (error) {
            console.log('Failure sending Mail');
            console.log(error);
            throw error;
        }
        else console.log('Mail sent successfully: ' + JSON.stringify(body));
    });
}

var emailTemplate = '<body style="font-family: ""Arial", sans-serif">' +
'<h3 style="color: #045FB4">MyClaimsHelper</h3>' +
'<strong><%= header %></strong>' +
'<br/>' +
'<br/>' +
'<%= body %>' +
'</body>'

exports.process = process;
