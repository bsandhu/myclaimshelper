define(['jquery', 'knockout', 'KOMap', 'app/model/claim'],
    function ($, ko, koMap, Claim) {

        function AppVM() {
            console.log('Init AppVM');
            this.claims = ko.observableArray();
            this.load();
        }

        AppVM.prototype.onAddNewClaim = function () {
            console.log('Adding new claim');
            window.location.href = 'claim.html';
        }

        AppVM.prototype.load = function () {
            var _this = this;
            $.get('/claim')
                .done(function (resp) {
                    var data = resp.data;
                    console.log('Loaded Claim ' + JSON.stringify(data));
                    $.each(data, function (index, claim) {
                        _this.claims.push(koMap.fromJS(claim, new Claim()));
                    });
                })
                .fail(function () {
                    console.log('Fail');
                })
        };

        return AppVM;
    });
