define(['jquery', 'amplify', 'underscore', 'app/utils/events', 'app/utils/session'],
    function ($, amplify, _, Events, Session) {

        /**
         * When the app starts up, we do no want to make any requests till the
         * user logs in. Queue up all the requests and listen for login evenet
         */
        var getReqQueue = [];
        var postReqQueue = [];

        amplify.subscribe(Events.LOGGED_IN, this, function () {
            while (getReqQueue.length > 0) {
                var defer = getReqQueue.pop();
                defer.resolve();
            }
        });

        amplify.subscribe(Events.LOGGED_IN, this, function () {
            while (postReqQueue.length > 0) {
                var item = postReqQueue.pop();
                item.fn(item.url, item.json, item.onDone, item.onFail);
            }
        });

        $.ajaxSetup({'beforeSend': setReqHeaders});

        function setReqHeaders(xhr) {
            if (Session.getCurrentUserAuthToken()) {
                xhr.setRequestHeader(
                    'Authorization',
                    'Bearer ' + Session.getCurrentUserAuthToken());
                xhr.setRequestHeader(
                    'UserId',
                    Session.getCurrentUserId());

                if (Session.getCurrentUserProfile()) {
                    xhr.setRequestHeader(
                        'group',
                        Session.getCurrentUserProfile().group);
                    xhr.setRequestHeader(
                        'ingroups',
                        Session.getCurrentUserProfile().ingroups);
                }
            }
        }

        function getJSON(url, skipAuthHeader) {
            if (!_.isBoolean(skipAuthHeader)) {
                skipAuthHeader = false;
            }
            if (!skipAuthHeader && !Session.getCurrentUserProfile()) {
                let defer = $.Deferred();
                let innerDefer = $.Deferred();
                defer
                    .then(function () {
                        return $.getJSON(url)
                            .then(function (data) {
                                innerDefer.resolve(data);
                            })
                            .fail(function (data) {
                                innerDefer.reject(data);
                            })
                    })
                getReqQueue.push(defer);
                return innerDefer;
            }
            return $.getJSON(url);
        }

        function post(url, json, onDone=$.noop, onFail) {
            if (!Session.getCurrentUserProfile()) {
                postReqQueue.push({fn: post, url: url, json: json, onDone: onDone, onFail: onFail});
                return;
            }
            if (!onFail) {
                onFail = function (jqXHR, textStatus, errorThrown) {
                    amplify.publish(Events.FAILURE_NOTIFICATION,
                        {
                            msg: "<strong>Server error</strong> while processing your request. Please retry." +
                            "<br>Techinal details: " + textStatus
                        });
                };
            }
            $.ajax({
                type: 'POST',
                url: url,
                data: json,
                contentType: 'application/json; charset=utf-8'
            }).done(function (data, textStatus, jqXHR) {
                console.log("Post on " + url);
                onDone(data, textStatus, jqXHR);
            }).fail(onFail);
        }

        return {
            'post': post,
            'getJSON': getJSON,
            'setReqHeaders': setReqHeaders
        };
    });