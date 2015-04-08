var assert = require('assert');
var jQuery = require('jquery-deferred');
var http = require('http');
var querystring = require('querystring');

/**
 * Invoke Alchemy API to identify people and places in plain text
 */
function extractEntities(txt) {
    var defer = jQuery.Deferred();
    extract(txt)
        .then(function (data) {
            var people = [];
            for (var i = 0; i < data.entities.length; i++) {
                var entity = data.entities[i];
                if (entity.type !== 'Person') {
                    continue;
                }
                people.push(entity.text);
            }
            defer.resolve(people);
        })
        .fail(function (err) {
            defer.reject(err);
        });
    return defer;
}


function extract(text) {
    var defer = jQuery.Deferred();
    var postData = querystring.stringify({ 'apikey': '98c9972fd185bc3e87b5a7194a2619bba9d3ad26',
        'text': text,
        'outputMode': 'json'});

    var options = {
        hostname: 'access.alchemyapi.com',
        port: 80,
        path: '/calls/text/TextGetRankedNamedEntities',
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length}
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Alchemy response: ' + chunk);
            defer.resolve(JSON.parse(chunk));
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        defer.reject(e);
    });

    console.log('Alchemy request: ' + postData);
    req.write(postData);
    req.end();
    return defer;
}

exports.extract = extract;
exports.extractEntities = extractEntities;