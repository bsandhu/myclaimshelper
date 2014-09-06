define(['jquery'],
    function ($) {

        function toDatetimePickerFormat(jsDate) {
            if (!jsDate instanceof Date) {
                throw 'Expecting JS Date. Got: ' + jsDate;
            }
            return jsDate.getDate() + '/' + jsDate.getMonth() + '/' + jsDate.getFullYear() + ' ' +
                jsDate.getHours() + ':' + jsDate.getMinutes();
        }

        return {
            'toDatetimePickerFormat': toDatetimePickerFormat,
            'DATETIME_PICKER_FORMAT' : 'm/d/Y H:i'
        };
    });