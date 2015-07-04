define(['jquery', 'amplify', 'app/utils/events'],
    function ($, amplify, Events) {

        function post(url, json, onDone, onFail) {
            if (!onFail) {
                onFail = function (jqXHR, textStatus, errorThrown) {
                    amplify.publish(Events.FAILURE_NOTIFICATION,
                        {msg: "<strong>Server error</strong> while processing your request. Please retry." +
                              "<br>Techinal details: " + textStatus});
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
            'post': post
        };
    });