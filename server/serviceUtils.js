var jQuery = require('jquery-deferred');
var EventEmitter = require('events').EventEmitter;


function createResponse(err, results) {
    if (err) {
        return {'status': 'Fail', 'details': err};
    } else {
        return {'status': 'Success', 'data': results};
    }
}

exports.eventEmitter = new EventEmitter();
exports.createResponse = createResponse;
