var MailParser = require('./mailParser.js').MailParser;

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

exports.MailRequestHandler = MailRequestHandler;
