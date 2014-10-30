var assert = require("assert");
var BillingItem = require("./../../server/model/billingItem.js");
var ClaimEntry = require("./../../server/model/claimEntry.js");
var claimsService = require("./../../server/services/claimsService.js");

describe('BillingItem', function(){
    var bi = new BillingItem();
    bi.note = "A billing item";

    var testEntry = new ClaimEntry();
    testEntry.billingItems = [bi];

    it('Save claim entry object', function (done) {
        claimsService
            .saveOrUpdateClaimEntryObject(testEntry)
            .done(function(data) {
                assert(data);
                assert.equal(data.status, 'Success');
                assert.equal(data.data.billingItems.length, 1);
                assert.equal(data.data.billingItems[0].note, 'A billing item');
                done();
            });
    });
});

