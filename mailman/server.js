var fs = require('fs');
var mailHandler = require('./handlers/mailHandler.js');
var simplesmtp = require('simplesmtp');
var MailParser = require('mailparser').MailParser;

var PORT = 25; //465
var smtp = simplesmtp.createServer();
var mailparser = new MailParser({debug:true});

// mailparser
mailparser.on('end', function(mail_object){
    console.log('From:', mail_object.from);
    console.log('To:', mail_object.to);
    console.log('Subject:', mail_object.subject);
    console.log('Text:', mail_object.text);
    console.log('Attachments:', mail_object.attachments);
    mailHandler.handleMail(mail_object);
});

mailparser.on('headers', function(headers){
    console.log('Headers:' + headers);
});

// smtp
smtp.on('startData', function(connection){
    console.log('Message from:', connection.from);
    console.log('Message to:', connection.to);
    connection.saveStream = fs.createWriteStream('/tmp/message-' + Date.now() + '.txt');
});

smtp.on('data', function(connection, chunk){
    connection.saveStream.write(chunk);
    mailparser.write(chunk);
});

smtp.on('dataReady', function(connection, callback){
    connection.saveStream.end();
    mailparser.end();
    console.log('Incoming message saved to /tmp/message.txt');
    callback(null, 'ABC1'); // ABC1 is the queue id to be advertised to the client
});

smtp.listen(PORT, function(err){
    if(!err){
        console.log('SMTP server listening on port ' + PORT);
    }else{
        console.log(err.message);
    }
});
