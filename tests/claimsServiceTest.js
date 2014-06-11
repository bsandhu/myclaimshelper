var assert = require("assert");
var claimsService = require("./../server/claims/claimsService.js")
var models = require("./../shared/models/models.js")

describe('Mongo Conn', function () {

    var claim = new models.Claim();
    claim.description = 'Test claim';

    it('Should be able to save claim', function (done) {
        claimsService.saveClaim(claim, function(err, result){
            assert(!err);
            done();
        });
    })

})