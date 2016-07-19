define(['jquery', 'app/utils/session', 'loggly'],
    function ($, Session) {

        var logglyQueue = [];

        function Audit() {}

        Audit.prototype.init = function() {
            var _this = this;
            var defer = $.Deferred();

            $.getJSON('/config')
                .then(function (resp) {
                    _this.env = resp.data.Env;

                    // Loggly init
                    _this._LTracker = window._LTracker || [];
                    _this._LTracker.push({
                        'logglyKey': resp.data.Loggly.key,
                        'sendConsoleErrors' : false,
                        'tag' : 'loggly-jslogger'  });

                    window.onerror = function() {
                        _this.error('windowOnError', arguments);
                    }

                    // Drain the msg queue
                    while (logglyQueue.length > 0) {
                        _this._LTracker.push(logglyQueue.pop());
                    }
                    defer.resolve();
                });
            return defer;
        };

        Audit.prototype._log = function(level, env, msg, data) {
            var payload = {
                'env': this.env,
                'level': level || "INFO",
                'user': Session.getCurrentUserId(),
                'msg': msg || '',
                'data': data || {}
            };

            if (!this._LTracker) {
                logglyQueue.push(payload);
            } else {
                this._LTracker.push(payload);
            }
        }

        Audit.prototype.info = function (msg, data) {
            this._log('INFO', this.env, msg, data);
        }

        Audit.prototype.warn = function (msg, data) {
            this._log('WARN', this.env, msg, data);
        }

        Audit.prototype.error = function (msg, data) {
            this._log('ERROR', this.env, msg, data);
        }

        return new Audit();
    });