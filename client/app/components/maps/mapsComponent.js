define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function mapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;

            var mapOptions = {
                center: { lat: 40.705, lng: -73.678},
                zoom: 9
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            var input = document.getElementById('pac-input');
            input.value = 'Manhattan';
            var types = document.getElementById('type-selector');
            
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

            var infowindow = new google.maps.InfoWindow();
            var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);

            function createMarker(place) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location,
                    title: place.name,
                });
                marker.setMap(map);                
            };

            var service = new google.maps.places.PlacesService(map);
            service.textSearch({query: input.value}, searchCallback);

            function searchCallback(results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        var place = results[i];
                        createMarker(place);
                    }
                }
            };

            google.maps.event.addListener(input, 'place_changed', function() {
                place = autocomplete.getPlace();
                console.log('place is ' + place);
                setAllMap(null);
                service.textSearch({query: place}, searchCallback);
            });

        }

        return {viewModel: mapsComponentVM, template: viewHtml};
    });