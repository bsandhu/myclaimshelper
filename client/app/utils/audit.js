define(['jquery', 'app/utils/session', 'loggly'],
    function ($, Session) {

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

                    defer.resolve();
                })
            return defer;
        };

        Audit.prototype._log = function(level, env, msg, data) {
            this._LTracker.push({
                'env': this.env,
                'level': level || "INFO",
                'user': Session.getCurrentUserId(),
                'msg': msg || '',
                'data': data || {}
            })
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