var MongoClient = require('mongodb').MongoClient;


function run(connUrl, fn) {
    MongoClient.connect(connUrl, function (err, db) {
        if (!err) {
            console.log("Connected");
            fn(db);
        }
    });
}

exports.run = run;
