var Mailgun = require('mailgun-js');
var MailParser = require('./mailParser.js').MailParser;
var config = require('../../config.js');

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
        sendReply(req.params.from, req.params.subject, body)
        console.log('Errors found: ' + parser.errors);
        return false;
    }
    else{
        // if no claim exists, create.
        // store mail entry as ClaimEntry.
        // store attachemts as such.
        console.log('All good! ' + JSON.stringify(mailEntry));
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
