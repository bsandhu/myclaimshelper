var jQuery = require('jquery-deferred');
var Mailgun = require('mailgun-js');

var config = require('../../config.js');
var claimsService = require("../../services/claimsService.js");
var ClaimEntry = require("../../model/claimEntry.js");
var MailParser = require('./mailParser.js').MailParser;
var saveToDB = require('../uploadService.js').saveToDB;
var mongoUtils = require('../../mongoUtils.js');


var process = function(req, res) {
  res.send(200, 'Request received successfully.');
  var dif = jQuery.Deferred();
  var parser = new MailParser();
  var mailEntry = parser.parseRequest(req);
  if (parser.errors.length > 0) {
    notifyFailure(parser.errors);
    dif.reject();
    return dif.promise()
  }
  return checkClaim(mailEntry)
          .then(saveAttachments)
          .then(saveEntry)
          .then(notifySuccess, notifyFailure);
};

var checkClaim(mailEntry){
  var r = jQuery.Deferred();
  var updateId = function(claimId){
    mailEntry.claimId = claimId;
    r.resolve(mailEntry);
  }
  findParentClaimId(mailEntry.claimId)
    .then(updateId);
  return r;
}

var findParentClaim = function(insuranceId){
  var db = mongoUtils.connect(config.db);
  var search = {insuranceCompanyFileNum: insuranceId};
  return mongoUtils.findEntities(mongoUtils.CLAIMS_COL_NAME, search, db);
};

var findParentClaimId = function(insuranceId){
  var r = jQuery.Deferred();
  var _getId(claims){
    if (claims.length < 1){
      r.reject('No Claim found with Insurance Id ' + insuranceId);
    }
    else if (claims.length > 1){
      r.reject('Oh! more than one Claim found with Insurance Id' + insuranceId);
    }
    else {
      r.resolve(claims[0]._id);
    }
  };

  findParentClaim(insuranceId).then(_getId);
  return r;
};

var saveEntry = function(mailEntry) {
  entry = constructClaimEntry(mailEntry);
  attachments = mailEntry.attachments;
  for (var i=0; i < attachments.length; i++){
    var metadata = {
       id  : attachments[i].id,
       name: attachments[i].name,
       size: attachments[i].size
    };
    entry.attachments.push(metadata);
  }
  var d = jQuery.Deferred();
	claimsService.saveOrUpdateClaimEntryObject(entry)
	  .then(function(obj){
            if (obj.status == 'Success'){
              mailEntry._id = obj.data._id;
              d.resolve(mailEntry);
            }
            // saveOrUpdateClaimEntryObject always returns 'resolved'
            // 'error' message is transmitted via 'status' flag.
            else{
              mailEntry.error = obj.details;
              d.reject(mailEntry);
            }
          }); 
  return d.promise(); 
};

// @returns ids of files saved to db.
var saveAttachment = function(attachment) {
  return saveToDB(attachment.name, attachment.path);
};

var saveAttachments = function(mailEntry) {
  var _success = function(){
      for (var i=0; i < mailEntry.attachments.length; i++){
        mailEntry.attachments[i].id = arguments[i];
      }
      return mailEntry;
  }

  var _failure = function(error){
    mailEntry.error = error;
    return mailEntry;
  }

  var x = jQuery.when.apply(null, mailEntry.attachments.map(saveAttachment));
  return x.then(_success, _failure);
};

var notifySuccess = function(mailEntry) {
  var body = 'Email processed successfully!';
  body += '\n\n' + mailEntry;
  sendEmail(mailEntry.mail.from, mailEntry.mail.subject, body);
  return mailEntry;
  //var r = jQuery.Deferred();
  //r.resolve(mailEntry);
  //return r.promise();
};

var notifyFailure = function(mailEntry) {
  var body = 'ERROR processing email.';
  body += '\n\n' + mailEntry.error;
  sendEmail(mailEntry.mail.from, mailEntry.mail.subject, body);
  return mailEntry;
  //var r = jQuery.Deferred();
  //r.reject(mailEntry);
  //return r.promise();
};

// helpers 

function constructClaimEntry(data){
  var entry = new ClaimEntry();
  entry.entryDate = new Date();
  entry.summary = data.mail.subject;
  entry.from = data.mail.from;
  entry.description = data.mail['body-plain'];
  entry.claimId = data.claimId;
  entry.tag = data.tags || [];
  entry.tag.push('email');
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
    if (error){
	concole.log(error); 
	throw error; }
    else console.log('Mail sent successfully: ' + JSON.stringify(body));
  });
}

exports.process = process;
