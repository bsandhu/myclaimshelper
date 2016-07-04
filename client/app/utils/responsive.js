define(['jquery'], function (amplify, SessionKeys) {

    return {
        onXSDevice: function () {
            return $(window).width() <= 768;
        },
        onSMDevice: function () {
            return $(window).width() >= 768 && $(window).width() <= 992;
        }
    }
});