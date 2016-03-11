var config = require('../config.js');
var jQuery = require("jquery-deferred");
var _ = require('underscore');


function getConfigREST(req, res) {
    console.log("Get Auth0 config");

    res.json({
        'status': 'Success',
        'data': {'Auth0': {
            'id': config.auth0_client_id,
            'domain': config.auth0_hostname }}
    });
}

exports.getConfigREST = getConfigREST;