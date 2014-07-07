define(['jquery'],
    function ($) {

        function post(url, json, onDone, onFail) {
            if (!onFail) {
                onFail = function (jqXHR, textStatus, errorThrown) {
                    alert('Fail: ' + jqXHR);
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
        }
    });