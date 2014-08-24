var Mailgun = require('mailgun-js');
var MailParser = require('./mailParser.js').MailParser;
var config = require('../../config.js');
var mongojs = require('mongojs');
var saveToDB = require('../uploadService.js').saveToDB;

// MailHandler
// create new claim
// create new entry
// create new attachment


function MailRequestHandler(){
}

MailRequestHandler.prototype.processRequest = function(req, res){
    res.send(200, 'Request received successfully.');
    var parser = new MailParser();
    var mailEntry = parser.parseRequest(req);
    if (parser.errors.length > 0){
        //email respond with errors
        var body = 'ERROR: could not process request.\r\n' + parser.errors;
        sendReply(req.params.from, req.params.subject, body);
        console.log('Errors found: ' + parser.errors);
        return false;
    }
    else{
        console.log('Email entry: ' + JSON.stringify(mailEntry));
        var db = mongojs(config.db, ['ClaimEntries']);
        var data = {'description': mailEntry.mail.subject,
                    'mail':mailEntry.mail, 
                    'claimId':mailEntry.claimId};
        db.ClaimEntries.save(data, function(err, data){
		if (err){
                    console.log(err);
                    sendReply(req.params.from, req.params.subject, body);
		}
		else{
                    console.log(data);
                    sendReply(req.params.from, req.params.subject, '007 processed!');
		}
	});
        // store attachemts as such...
        for (attachment in mailEntry['attachments']){
            saveToDB(attachment.name, attachment.path).fail(function(){
                var body = 'ERROR: failed to store attachment: ' + attachment.name;
                sendReply(req.params.from, req.params.subject, body);
            });
        }
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
        console.log(body);
    });
}

exports.MailRequestHandler = MailRequestHandler;
