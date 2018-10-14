var assert = require('assert');
var jQuery = require('jquery-deferred');
var https = require('https');
var querystring = require('querystring');

/**
 * Invoke Alchemy API to identify people and places in plain text
 */
function extractEntities(txt) {
    var defer = jQuery.Deferred();
    defer.resolve([]);
    /* 
    Deprecate dependency on Alchemy
    
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
            // Don't want the app workflow to fail with defer.reject
            console.error('Error while extracting entities: ' + e);
            defer.resolve([]);
        });
        */
    return defer;
}


function extract(text) {
    var defer = jQuery.Deferred();
    var postData = querystring.stringify({
        'apikey': '98c9972fd185bc3e87b5a7194a2619bba9d3ad26',
        'text': text,
        'outputMode': 'json'
    });

    var options = {
        hostname: 'access.alchemyapi.com',
        port: 443,
        path: '/calls/text/TextGetRankedNamedEntities',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    var req = https.request(options, function (res) {
        var data = '';

        res.on('data', function (chunk) {
            data += chunk.toString('utf-8');
        });
        res.on('end', function () {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                var error = new Error('Bad client request status: ' + res.statusCode + ' .Data: ' + res.data);
                console.error(error);
                defer.reject(error);
            } else {
                try {
                    console.log('Alchemy response: ' + data);
                    defer.resolve(JSON.parse(data));
                } catch (e) {
                    console.error('Error parsing Alchemy response. ' + e);
                    defer.reject(e);
                }
            }
        });
    });

    // Fire off request
    req.on('error', function (e) {
        console.error('Problem with Alchemy request: ' + e.message);
        defer.reject(e);
    });
    req.write(postData);
    req.end();
    return defer;
}

exports.extract = extract;
exports.extractEntities = extractEntities;
