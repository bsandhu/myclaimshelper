var jQuery = require('jquery-deferred');

function createResponse(err, results) {
    if (err) {
        return {'status': 'Fail', 'details': err};
    } else {
        return {'status': 'Success', 'data': results};
    }
}

exports.createResponse = createResponse;
