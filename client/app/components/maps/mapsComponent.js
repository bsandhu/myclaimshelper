define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html',
        'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU' /*+ 'callback=initialize'*/],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function mapsComponentVM(params) {
            //console.assert(params.claimEntry, 'Expecting claimEntry param');
            //this.claimEntry = params.claimEntry;

            var mapOptions = {
                center: { lat: 40.705, lng: -73.678},
                zoom: 9
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            var input = document.getElementById('pac-input');

            var types = document.getElementById('type-selector');
//            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
//            map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

            //var autocomplete = new google.maps.places.Autocomplete(input);
            //autocomplete.bindTo('bounds', map);

            var infowindow = new google.maps.InfoWindow();
            var marker = new google.maps.Marker({
                map: map,
                anchorPoint: new google.maps.Point(0, -29)
            });


        }


        return {viewModel: mapsComponentVM, template: viewHtml};
    });