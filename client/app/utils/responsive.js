define(['jquery'], function (amplify, SessionKeys) {

    return {
        onXSDevice: function () {
            return $(window).width() <= 768;
        },
        onSMDevice: function () {
            return $(window).width() >= 768 && $(window).width() <= 992;
        },
        onLGDevice: function () {
            return $(window).width() > 992;
        },
        deviceInfo: function(){
            return {
                size :  this.onXSDevice() ? 'XS' : (this.onSMDevice() ? 'SM' : 'LG'),
                width:  $(window).width(),
                userAgent: navigator.userAgent,
                vendor: navigator.vendor
            }
        }
    }
});