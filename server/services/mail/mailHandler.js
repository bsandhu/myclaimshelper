let jQuery = require('jquery-deferred');
let Mailgun = require('mailgun-js');
let _ = require('underscore');
let lodash = require('lodash');
let moment = require('moment-timezone');

let config = require('../../config.js');
let claimsService = require("../../services/claimsService.js");
let ClaimEntry = require("../../model/claimEntry.js");
let BillingItem = require('../../model/billingItem.js');
let States = require('../../model/states.js');
let MailParser = require('./mailParser.js').MailParser;
let saveToDB = require('../uploadService.js').saveToDB;
let mongoUtils = require('../../mongoUtils.js');
let DateUtils = require('../../shared/dateUtils.js');
let Consts = require('./../../shared/consts.js');
let broadcastNoHTTP = require('../../services/notificationService.js').broadcastNoHTTP;

/**
 * Invoked by the Mailgun service
 */
let process = function (req, res, testMode) {
    res.send(200, 'Request received successfully.');
    console.log('*** Starting email processing ***')
    let sendSuccessEmail, sendErrorEmail;

    if (_.isBoolean(testMode) && testMode == true) {
        sendSuccessEmail = false
        sendErrorEmail = false;
    } else {
        sendSuccessEmail = config.send_success_email_reply;
        sendErrorEmail = config.send_failure_email_reply;
    }

    // Remove any spurious quotes around email addr
    let from = req.params.To.toUpperCase().split('@')[0];
    from = from.replace('"', '');
    from = from.replace("'", '');
    console.log('Email from: ' + from);
    let defer = jQuery.Deferred();

    let isTestUser = ['TESTUSER1', 'TESTUSER2'].indexOf(from) >= 0;
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

    let parser = new MailParser();
    jQuery.when(parser._getAllKnownClaims(from), parser._getAllKnownUserIds())
        .then(function (allKnownClaims, allKnownUserIds) {

            let mailEntry = parser.parseRequest(req, allKnownClaims, allKnownUserIds);

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

let saveEntry = function (mailEntry) {
    console.log('Saving claim entry');
    let d = jQuery.Deferred();

    constructClaimEntry(mailEntry, mailEntry.attachments)
        .then(function (entry) {
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
        });
    return d.promise();
};

// @returns ids of files saved to db.
let saveAttachment = function (attachment) {
    return saveToDB(attachment.name, attachment.path);
};

let saveAttachments = function (mailEntry) {
    console.log('Saving attachments');
    let _success = function () {
        for (let i = 0; i < mailEntry.attachments.length; i++) {
            mailEntry.attachments[i].id = arguments[i];
        }
        return mailEntry;
    }

    let _failure = function (error) {
        mailEntry.error = error;
        return mailEntry;
    }

    let x = jQuery.when.apply(null, mailEntry.attachments.map(saveAttachment));
    return x.then(_success, _failure);
};

let notifySuccess = function (sendEmail, mailEntry) {
    broadcastNoHTTP(
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.INFO,
        '<b>Email processed</b> ' + mailEntry.mail.subject + '<a href="#/claimEntry/' + mailEntry.claimId + '/' + mailEntry._id + '">Goto task</a>',
        mailEntry.owner,
        mailEntry.group)
        .always(function email() {
            if (sendEmail) {
                let header = 'Email <i>' + mailEntry.mail.subject + '</i> processed';
                let body = JSON.stringify(mailEntry);
                sendEmailViaMailgun(mailEntry.mail.from, mailEntry.mail.subject, header, body);
            }
        });
    return mailEntry;
};

let notifyFailure = function (sendEmail, mailEntry) {
    let header = '<b>Failed to process email</b> ' + mailEntry.mail.subject;
    let body = JSON.stringify(mailEntry.errors[0]) || 'There was a problem on our server. Apologies.';

    let notifyFn = _.partial(broadcastNoHTTP,
        Consts.NotificationName.NEW_MSG,
        Consts.NotificationType.ERROR,
        header,
        mailEntry.owner,
        mailEntry.group);

    if (mailEntry.owner) {
        notifyFn();
    }
    if (sendEmail) {
        sendEmailViaMailgun(mailEntry.mail.from, mailEntry.mail.subject, header, body);
    }
    return mailEntry;
};

// **** Helpers ****

function constructClaimEntry(data, attachments) {
    let d = jQuery.Deferred();

    // Get user profile
    mongoUtils.getEntityById(data.owner, mongoUtils.USERPROFILE_COL_NAME, data.owner, [data.owner])
        .then(function (err, profile) {
            let defer = jQuery.Deferred();
            if (!err) {
                defer.resolve(profile);
            } else {
                console.error('Fatal. Could not fund profile for user: ' + data.owner);
                defer.reject(err);
            }
            return defer;
        })
        // Get TZ for zipcode in profile
        .then(function (profile) {
            mongoUtils
                .connect()
                .then(function (db) {
                    mongoUtils.findEntities(mongoUtils.ZIPCODES_COL_NAME, {'zip': profile.contactInfo.zip}, db, false)
                        .then(function (zipCodesInfo) {
                            let zipInfo = zipCodesInfo[0];
                            console.log('User in TZ: ' + zipInfo.timezone);

                            // UI stores dates in local TZ
                            // Use Moment TZ to resolve offset
                            let zone = moment.tz.zone(zipInfo.timezone);
                            let zoneOffsetInMinutes = zone.offset((DateUtils.startOfToday()).getTime());

                            let entry = new ClaimEntry();
                            entry.entryDate = (new Date()).getTime();
                            entry.dueDate = (DateUtils.startOfTodayUTC()).getTime() + (zoneOffsetInMinutes * 60 * 1000);
                            entry.updateDate = (new Date()).getTime();
                            entry.summary = data.mail.subject;
                            entry.from = data.mail.from;
                            entry.description = data.mail['body-html'];
                            entry.claimId = data.claimId;
                            entry.tag = data.tags || [];
                            entry.tag.push('email');
                            entry.state = States.TODO;
                            entry.owner = data.owner;
                            // Do not show notification to group
                            entry.group = data.owner;

                            // Service does the linking to the ClaimEntry
                            entry.billingItem = new BillingItem();

                            // Associate attachment metadata
                            for (let i = 0; i < attachments.length; i++) {
                                let metadata = {
                                    id: attachments[i].id,
                                    name: data.fileNum + '-' + attachments[i].name,
                                    size: attachments[i].size,
                                    type: attachments[i].type,
                                    owner: data.owner,
                                    group: data.owner,
                                    lastModifiedDate: attachments[i].mtime.getTime()
                                };
                                entry.attachments.push(metadata);
                            }

                            d.resolve(entry);
                        })
                })
        })
    return d.promise();
}

function sendEmailViaMailgun(recipient, subject, header, body) {
    if (config.ev === config.ENV_LOCAL) {
        console.log('')
        return;
    }

    let compiled = _.template(emailTemplate);
    header = lodash.trim(header, '"');
    body = lodash.trim(body, '"');
    let htmlBody = compiled({header: header, body: body});

    let mailgun = new Mailgun({
        apiKey: config.mailgun.api_key,
        domain: config.mailgun.domain
    });
    let data = {
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

let emailTemplate = '<body style="font-family: ""Arial", sans-serif">' +
    '<h3 style="color: #045FB4">MyClaimsHelper</h3>' +
    '<strong><%= header %></strong>' +
    '<br/>' +
    '<br/>' +
    '<%= body %>' +
    '</body>'

exports.process = process;
