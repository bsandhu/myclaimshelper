var assert = require('assert');
var extractionService = require('./../../server/services/entityExtractionService.js');

describe('EntityExtraction Service', function () {

    var testText =
        'ME: Diane, Just a quick follow up with Elnora Regan to see if your property dept. ' +
        'approved settlement and if an offer has been extended?        ' +
        'Please advise.        Bill  516-524-3982';

    it('Invoke Apchemy service', function (done) {
        extractionService.extract(testText)
            .then(function (data) {
                assert.ok(data);
                done();
            })
            .fail(function (e) {
                assert.fail('', e);
                done();
            });
    });
    it('Extract', function (done) {
        extractionService.extractEntities(testText)
            .then(function(people){
               assert.ok(people.length === 3);
               assert.equal(people[0], 'Elnora Regan');
               assert.equal(people[1], 'Bill 516-524-3982');
               assert.equal(people[2], 'Diane');
               done();
            })
            .fail(function (e) {
                assert.fail('', e);
                done();
            });
    });
});