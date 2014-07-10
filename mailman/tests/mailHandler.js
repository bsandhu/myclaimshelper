var mh = require('../handlers/mailHandler.js');

var r = mh.parseMail({'subject':'FW: abc |claim id: 123'});
console.log(r)
var r = mh.parseMail({'subject':'claim id: 123'});
console.log(r)

var mail = {'subject':'claim id:abc'};
var r = mh.parseMail(mail);
console.log(r)
var r = mh._getClaimId(mail);
console.log(r)

var r = mh.handleMail(mail);
