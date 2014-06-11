var models = require('./../../shared/models/models.js');
var MongoClient = require('mongodb').MongoClient;

function run(fn) {
    MongoClient.connect("mongodb://localhost:9090/AgentDb", function (err, db) {
        if (!err) {
            console.log("We are connected");
            fn(db);
        }
    });
}

function saveClaim(claim, done) {
    run(function (db) {
        db.createCollection('Claims', function (err, claims) {
            if (err) {
                console.error('Failed to create collection . ' + err);
            } else {
                console.log('Created collection Claims');
            }
            claims.insert(claim, {w: 1}, function (err, result) {
                if (err) {
                    console.error('Failed to insert Claim. ' + err);
                } else {
                    console.log('Inserted Claim');
                    done(err, result);
                }
            });
        });
    });
};

function getClaim(req, res) {
    console.log('Getting claim: ' + req.params.id);
    var claim = new models.Claim();
    claim.id = 100;
    claim.description = 'Foo'
    res.json(claim);
}

exports.getClaim = getClaim;
exports.saveClaim = saveClaim;
