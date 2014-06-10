define(['jquery', 'knockout', 'KOMap'],
    function ($, ko, koMap) {

        function ClaimsVM() {
            console.log('Init ClaimsVM');
            this.claims = ko.observableArray([]);
            this.load();
        };

        ClaimsVM.prototype.load = function () {
            console.log('Loading claims');
            $.get('/claim/100')
                .done(function (data) {
                    console.log(data);
                    this.claims = koMap.fromJS(data);
                })
                .fail(function () {
                    console.log('Fail');
                })
        };

        return ClaimsVM;
    });