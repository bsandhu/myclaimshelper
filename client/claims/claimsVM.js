define(['jquery', 'knockout', 'KOMap', 'claims/Claim'],
    function ($, ko, koMap, Claim) {

        function ClaimsVM() {
            console.log('Init ClaimsVM');
            this.claims = ko.observableArray();
            this.load();
        }

        ClaimsVM.prototype.load = function () {
            var _this = this;
            $.get('/claim/getAll')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded claims ' + JSON.stringify(data));
                    $.each(data, function (index, claim) {
                        _this.claims.push(koMap.fromJS(claim, new Claim()));
                    });
                })
                .fail(function () {
                    console.log('Fail');
                })
        };

        return ClaimsVM;
    });
