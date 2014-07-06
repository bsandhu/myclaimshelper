var simplesmtp = require('simplesmtp');

var message = 'from: vadan@abc.ee\r\n' +
                'to: vadan@node.ee\r\n' +
                'subject: the subject\r\n' +
                '\r\n' +
                'Hello world!\r\n' +
                '' ;

mail('sender@gmail.com', 'abc@gmail.com', message);

/**
 * Send a raw email
 *
 * @param {String} from E-mail address of the sender
 * @param {String|Array} to E-mail address or a list of addresses of the receiver
 * @param {[type]} message Mime message
 */

var PORT = 25; //465

function mail(from, to, message) {
    var client = simplesmtp.connect(PORT, 'localhost', {
        secureConnection: false,
        debug: true
    });

    client.once('idle', function() {
        client.useEnvelope({
            from: from,
            to: [].concat(to || [])
        });
    });

    client.on('message', function() {
        client.write(message.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..'));
        client.end();
    });

    client.on('ready', function(success) {
        client.quit();
    });

    client.on('error', function(err) {
        console.log('ERROR');
        console.log(err);
    });

    client.on('end', function() {
        console.log('DONE')
    });
}
