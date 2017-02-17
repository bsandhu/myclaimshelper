let assert = require('assert');
let fs = require('fs');
let convertFactory = require('electron-html-to');
let Mailgun = require('mailgun-js');
let config = require('./../config.js');
let path = require('path');

let pdf = require('html-pdf');
let _ = require('underscore');

let mongoUtils = require('./../mongoUtils.js');
let serviceUtils = require('./../serviceUtils.js');
let uploadService = require('./uploadService.js');
let Form = require('./../model/form');
let addOwnerInfo = mongoUtils.addOwnerInfo;
let sendResponse = serviceUtils.sendResponse;
let jQuery = require('jquery-deferred');

function PDF_PARAMS(html) {
    return {
        html: html,
        pdf: {
            marginsType: .25,
            format: 'Letter',
            printBackground: false,
            landscape: false
        }
    }
};

function convertToPdf(req, res) {
    assert.ok(req.params.htmlContent, 'Expecting htmlContent as a parameter');
    assert.ok(req.params.formName, 'Expecting formName as a parameter');
    console.log('Converting to pdf..');
    let html = req.params.htmlContent;
    let fileName = req.params.formName;

    conversion = convertFactory({
        converterPath: convertFactory.converters.PDF
    });
    conversion(
        PDF_PARAMS(html),
        function (err, result) {
            if (err) {
                return console.error(err);
            }
            console.log(result.numberOfPages);
            uploadService.streamFileToClient(
                res,
                {filename: fileName, contentType: 'application/pdf'},
                result.stream
            );
        });
}

function emailPdf(req, res) {
    assert.ok(req.params.htmlContent, 'Expecting htmlContent as a parameter');
    assert.ok(req.params.email, 'Expecting email as a parameter');

    let html = req.params.htmlContent;
    let email = req.params.email;
    console.log('Email with pdf.. ' + JSON.stringify(email));

    conversion = convertFactory({
        converterPath: convertFactory.converters.PDF
    });
    conversion(
        PDF_PARAMS(html),
        function (err, result) {
            if (err) {
                return console.error(err);
            }
            console.log("Converted to Pdf. Pages: " + result.numberOfPages);
            let inStream = result.stream;
            let outStream = fs.createWriteStream('/tmp/' + email.attachments[0].name);
            inStream.pipe(outStream);
            inStream.on('end', () => {
                //outStream.end();
                sendEmailViaMailgun(email).then(res.end());
            })
        });
}

function sendEmailViaMailgun(email) {
    console.log('Emailing pdf');
    let defer = jQuery.Deferred();

    let mailgun = new Mailgun({
        apiKey: config.mailgun.api_key,
        domain: config.mailgun.domain
    });
    let data = {
        from: email.from,
        to: email.to,
        bcc: email.cc,
        subject: email.subject,
        text: email.body || 'Document attached',
        attachment: path.join('/tmp', email.attachments[0].name)
    };
    mailgun.messages().send(data, function (error, body) {
        console.log(data);
        if (error) {
            console.log('Failure sending Mail');
            console.log(error);
            defer.reject(error);
        } else {
            console.log('Mail sent successfully: ' + JSON.stringify(body));
            defer.resolve();
        }
    });
    return defer;
}

exports.convertToPdf = convertToPdf;
exports.emailPdf = emailPdf;