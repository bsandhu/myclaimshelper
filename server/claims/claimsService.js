var models = require('./../../shared/models/models.js');

function getClaim(req, res) {
    console.log('Getting claim: ' + req.params.id);
    var claim = new models.Claim();
    claim.id = 100;
    claim.description = 'Foo'
    res.json(claim);
}

exports.getClaim = getClaim;
