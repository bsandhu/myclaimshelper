var jQuery = require('jquery-deferred');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var qs = require('querystring');
var util = require('util');
var url = require('url');
var https = require('https');
var utf8js = require('utf8');
var querystring = require('querystring');
var entities = require("entities");


var GoogleContactscClient = function (authToken) {
    assert.ok(authToken, 'Expecting Auth token issued by google.auth.OAuth2 client');
    this.token = authToken;
};

GoogleContactscClient.prototype = {};

util.inherits(GoogleContactscClient, EventEmitter);

GoogleContactscClient.prototype._request = function (params, cb) {
    assert.ok(params);
    assert.ok(params.method);
    assert.ok(params.path);

    var isGet = params.method === 'GET';
    var reqBody = params.body;
    var opts = {
        host: 'www.google.com',
        port: 443,
        path: params.path,
        method: params.method,
        headers: {
            'Authorization': 'OAuth ' + this.token,
            'GData-Version': 3
        }
    };

    if (params.method == 'POST') {
        opts.headers['content-type'] = 'application/atom+xml';
    }
    if (params.method == 'POST' || params.method == 'DELETE' || params.method == 'PUT') {
        opts.headers['If-Match'] = '*';
    }
    console.log("New Request");
    console.log('Opts: ' + JSON.stringify(opts));
    console.log('Body: ' + JSON.stringify(params.body));

    var req = https.request(opts, function (res) {
        var data = '';

        res.on('data', function (chunk) {
            data += chunk.toString('utf-8');
        });
        res.on('error', function (err) {
            console.error(JSON.stringify(err));
            cb(err);
        });
        res.on('end', function () {
            params;
            if (res.statusCode < 200 || res.statusCode >= 300) {
                var error = new Error('Bad client request status: ' + res.statusCode + ' .Data: ' + res.data);
                console.error(error);
                return cb(error);
            }
            try {
                console.info(data);
                isGet
                    ? cb(null, JSON.parse(data))
                    : cb(null, data);
            }
            catch (err) {
                console.error(JSON.stringify(err));
                cb(err);
            }
        });
    });
    if (params.method == 'POST') {
        req.write(params.body);
    }
    req.end();
};

/*********************************************************/
/* Contact Groups */
/*********************************************************/

GoogleContactscClient.prototype.getGroups = function () {
    var defer = jQuery.Deferred();
    var self = this;
    this._request(_.extend({
            method: 'GET',
            path: '/m8/feeds/groups/default/full?alt=json&max-results=2000'
        }, this.params),
        onGroup);

    function onGroup(err, groups) {
        if (err) {
            defer.reject(err);
        } else {
            var names = _.map(groups.feed.entry, function (entry) {
                return {id: entry.id['$t'], title: entry.title['$t']};
            });
            defer.resolve(names);
        }
    }

    return defer;
}

GoogleContactscClient.prototype.createGroup = function (groupName) {
    var defer = jQuery.Deferred();
    var self = this;
    var reqTmpl = _.template(
        '<entry xmlns:gd="http://schemas.google.com/g/2005">' +
        '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/contact/2008#group"/>' +
        '<title type="text"><%= name %></title>' +
        '<content type="text"><%= name %></content>' +
        '</entry>');

    var postBody = reqTmpl({'name': groupName});
    this._request(
        _.extend({
            method: 'POST',
            body: postBody,
            path: '/m8/feeds/groups/default/full'
        }, this.params),
        onCreatedGroup);

    function onCreatedGroup(err, respData) {
        err ? defer.reject(err) : defer.resolve(respData);
    }

    return defer;
}

GoogleContactscClient.prototype.deleteGroup = function (groupIdAsPath) {
    var defer = jQuery.Deferred();
    var self = this;
    this._request(
        _.extend({
            method: 'DELETE',
            path: groupIdAsPath
        }, this.params),
        onDlete);

    function onDlete(err, respData) {
        err ? defer.reject(err) : defer.resolve(respData);
    }

    return defer;
}

/*********************************************************/
/* Contacts */
/*********************************************************/

/**
 * Note: The Contacts API has a hard limit to the number of results it can return at a
 * time even if you explicitly request all possible results. If the requested feed has
 * more fields than can be returned in a single response, the API truncates the feed and adds
 * a "Next" link that allows you to request the rest of the response.
 */
GoogleContactscClient.prototype.getContacts = function (groupIdAsPath) {
    var defer = jQuery.Deferred();
    var self = this;
    this._request(
        _.extend({
            method: 'GET',
            path: '/m8/feeds/contacts/default/thin?alt=json&max-results=5000&group=' + groupIdAsPath
        }, this.params),
        onReceivedContacts);

    function onReceivedContacts(err, data) {
        if (err) {
            defer.reject(err);
        } else {
            var feed = _.get(data, 'feed', []);
            var entry = _.get(data, 'feed.entry', []);
            if (!entry.length) {
                defer.resolve([]);
            } else {
                defer.resolve(self._saveContactsFromFeed(feed));
            }
        }
    }

    return defer;
};

GoogleContactscClient.prototype._saveContactsFromFeed = function (feed) {
    var self = this;
    var simplified = _.map(feed.entry, function (entry) {
        var el;
        var title = entry.title['$t'];
        if (title) {
            el = {
                id: entry.id['$t'],
                name: title
            };
            if (entry['gd$email']) {
                el.email = entry['gd$email'][0].address;
            }
            if (entry['gd$phoneNumber']) {
                el.phone = entry['gd$phoneNumber'][0]['$t'];
            }
        }
        if (el) {
            return el;
        }
    });
    return _.filter(simplified, function (contact) {
        return contact != undefined
    });
}

GoogleContactscClient.prototype.createContact = function (contactObjs, groupId) {
    assert.ok(_.isArray(contactObjs), 'Expecting Array');
    assert.ok(contactObjs.length <= 100, 'Max batch size is 100');

    var defer = jQuery.Deferred();
    var self = this;

    var postBody = self.creationBatchRequestBody(contactObjs, groupId);
    postBody = (postBody.charCodeAt(0) === 0xFEFF) ? postBody.substring(1) : postBody;

    this._request(
        _.extend({
            method: 'POST',
            body: postBody,
            path: '/m8/feeds/contacts/default/full/batch'
        }, this.params),
        onReceivedContact);

    function onReceivedContact(err, respData, body) {
        // Function is called in $.whne([deferred])
        // Some saves might succeed while others might fail
        // All [deferred] have to resolve to avoid rejection of the step
        // Mark as success and handle subsequently
        if (err) {
            console.error('Failed to create contact. ' + respData);
            defer.resolve({status: 'failure', 'data': err});
        } else {
            console.log('Created contact. ' + respData);
            defer.resolve({status: 'success', 'data': respData});
        }
    }
    return defer;
}

GoogleContactscClient.prototype.creationBatchRequestBody = function (contactObjs, groupId) {
    var batchHeader =
        '<feed xmlns="http://www.w3.org/2005/Atom" ' +
        'xmlns:gd="http://schemas.google.com/g/2005" ' +
        'xmlns:batch="http://schemas.google.com/gdata/batch"> ';
    var batchBody = '';
    var batchFooter = '</feed>';
    var self = this;

    contactObjs.forEach(function (contactObj) {
        batchBody = batchBody + self.creationRequestBody(contactObj, groupId);
    })
    return batchHeader + batchBody + batchFooter;
}

GoogleContactscClient.prototype.creationRequestBody = function (contactObj, groupId) {
    var headerTmpl = _.template(
        '<entry>' +
        '<batch:id>create</batch:id>' +
        '<batch:operation type="insert"/>' +

        // '<atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:gd="http://schemas.google.com/g/2005">' +
        '<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/contact/2008#contact"/>' +
        '<gd:name>' +
        '<gd:fullName><%= name %></gd:fullName>' +
        '</gd:name>');

    var emailTmpl = _.template(
        '<gd:email rel="http://schemas.google.com/g/2005#work" ' +
        'primary="true" ' +
        'address="<%= email %>" displayName="<%= name %>"/>');

    var homePhoneTmpl = _.template(
        '<gd:phoneNumber rel="http://schemas.google.com/g/2005#work" primary="true">' +
        '<%= phone %>' +
        '</gd:phoneNumber>');

    var mobilePhoneTmpl = _.template(
        '<gd:phoneNumber rel="http://schemas.google.com/g/2005#mobile">' +
        '<%= phone %>' +
        '</gd:phoneNumber>');

    var groupTmpl = _.template(
        '<gContact:groupMembershipInfo href="<%= group %>"/>');

    var addrTmpl = _.template(
        '<gd:structuredPostalAddress rel ="http://schemas.google.com/g/2005#work" primary="true">' +
        '<gd:street><%= street %></gd:street>' +
        '<gd:city><%= city %></gd:city>' +
        '<gd:region><%= region %></gd:region>' +
        '<gd:postcode><%= zip %></gd:postcode>' +
        '</gd:structuredPostalAddress>');

    var footerTmpl = _.template('</entry>');

    var enc = entities.encodeXML;
    var name = contactObj.name || contactObj.businessName || 'Unknown';
    var header = headerTmpl({'name': enc(name)});
    var email = emailTmpl({'email': contactObj.email, 'name': enc(name)});
    var homePhone = homePhoneTmpl({'phone': enc(contactObj.phone || '')});
    var mobilePhone = mobilePhoneTmpl({'phone': enc(contactObj.cell || '')});
    var group = groupTmpl({'group': groupId});
    var addr = addrTmpl({
        'street': enc(contactObj.streetAddress || 'Unknown'),
        'city': enc(contactObj.city || 'Unknown'),
        'region': enc(contactObj.state || 'Unknown'),
        'zip': enc(contactObj.zip || 'Unknown')
    });
    var footer = footerTmpl({});

    var result = header;
    if (contactObj.email) result = result + email;
    if (contactObj.phone) result = result + homePhone;
    if (contactObj.cell) result = result + mobilePhone;
    if (contactObj.streetAddress || contactObj.city || contactObj.state || contactObj.zip) result = result + addr;
    result = result + group;
    result = result + footer;
    return result;
}

GoogleContactscClient.prototype.deleteContact = function (idAsPaths) {
    assert.ok(_.isArray(idAsPaths), 'Expecting Array');
    assert.ok(idAsPaths.length <= 100, 'Max batch size is 100');

    var defer = jQuery.Deferred();
    var self = this;
    var postBody = self.deletionBatchRequestBody(idAsPaths);
    postBody = (postBody.charCodeAt(0) === 0xFEFF) ? postBody.substring(1) : postBody;

    this._request(
        _.extend({
            method: 'POST',
            body: postBody,
            path: '/m8/feeds/contacts/default/full/batch'
        }, this.params),
        onDelete);

    function onDelete(err, respData) {
        err ? defer.reject(err) : defer.resolve(respData);
    }
    return defer;
}

GoogleContactscClient.prototype.deletionBatchRequestBody = function (idAsPaths) {
    var batchHeader =
        '<feed xmlns="http://www.w3.org/2005/Atom" ' +
        'xmlns:gd="http://schemas.google.com/g/2005" ' +
        'xmlns:batch="http://schemas.google.com/gdata/batch"> ';
    var batchBody = '';
    var batchFooter = '</feed>';
    var self = this;

    idAsPaths.forEach(function (idAsPath) {
        batchBody = batchBody +
            '<entry gd:etag="*">' +
            '<batch:id>delete</batch:id>' +
            '<batch:operation type="delete"/>' +
            '<id>' + idAsPath + '</id>' +
            '</entry>';
    })
    return batchHeader + batchBody + batchFooter;
}


exports.GoogleContactsClient = GoogleContactscClient;
