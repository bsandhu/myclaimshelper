var Mailgun = require('mailgun-js');
var MailParser = require('./mailParser.js').MailParser;
var config = require('../../config.js');
var saveToDB = require('../uploadService.js').saveToDB;
var ClaimEntry = require("../../model/claimEntry.js");
var claimsService = require("../../services/claimsService.js");


function MailRequestHandler(){}

MailRequestHandler.prototype.processRequest = function(req, res){
    res.send(200, 'Request received successfully.');
    var parser = new MailParser();
    var mailEntry = parser.parseRequest(req);
    if (parser.errors.length > 0){
        var body = 'ERROR: could not process request.\r\n' + parser.errors;
        sendReply(req.params.from, req.params.subject, body);
        console.log('Errors found: ' + parser.errors);
        return false;
    }
    else{
        var entry = new ClaimEntry();
        entry.entryDate = new Date();
        entry.summary = mailEntry.mail.subject;
        entry.description = mailEntry.mail['body-plain'];
        entry.claimId = mailEntry.claimId;
        entry.tag = mailEntry.tags;
        // store attachemts as such...
        mailEntry['attachments'].forEach(function(attachment){
            saveToDB(attachment.name, attachment.path)
                .done(function(seqNum){
                    console.log('Success storing attachment: ' + attachment.name);
                    console.log('SeqNum: ' + seqNum);
                })
                .fail(function(err){
                var body = 'ERROR: failed to store attachment: ';
                body += attachment.name;
                body += '\n' + err;
                console.error(body);
                sendReply(req.params.from, req.params.subject, body);
                });
        });
        // store claimEntry
        claimsService.saveOrUpdateClaimEntryObject(entry)
                .done(function (entry){
                    sendReply(req.params.from, req.params.subject, 'Success processing email!');
		})
                .fail(function (err){
                    console.log(err);
                    sendReply(req.params.from, req.params.subject, err);
		});
        return true;
    }
};


function sendReply(recipient, subject, body){
    var mailgun = new Mailgun({apiKey: config.mailgun.api_key,
                               domain: config.mailgun.domain});
    var data = {
        from: 'Agent 007 <no-reply@007.com>',
        to: recipient,
        subject: subject,
        text: body
    };
    mailgun.messages().send(data, function(error, body){
        if (error) throw error;
        else console.log('Mail sent successfully: ' + JSON.stringify(body));
    });
}

exports.MailRequestHandler = MailRequestHandler;
