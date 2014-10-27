define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');
        $('#map-canvas').css('z-index', '-1');
        function mapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;

            var mapOptions = {
                center: {lat: 40.800, lng: -73.900},
                zoom: 9
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            var markers = [];
            var input = document.getElementById('pac-input');
            input.value = 'Manhattan';
            //var types = document.getElementById('type-selector');

            //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            //map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);
            var close = document.getElementById('map-close');
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(close);
            var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);

            function createMarker(place) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location,
                    title: place.name
                });
                marker.setMap(map);
                markers.push(marker);
            }

            var service = new google.maps.places.PlacesService(map);
            service.textSearch({query: input.value}, function (results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        var place = results[i];
                        createMarker(place);
                    }
                }
            });

            function setAllMap(map) {
                for (var i = 0; i < markers.length; i++) {
                    markers[i].setMap(map);
                }
            }

            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                setAllMap(null);
                markers = [];
                if (!place.geometry) {
                    return;
                }
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
                createMarker(place);
            });

            google.maps.event.addListenerOnce(map, 'idle', function() {
                google.maps.event.trigger(map, 'resize');
            });

/*            $('maps').popover({selector: '[rel="map-canvas"]'});*/
            this.showMap = function() {
                console.log('display map');
/*                if ($('#map-canvas').css('z-index', '-1')) {
                    console.log('2');
                    $('#map-canvas').css('z-index', '2');
                }
                else if ($('#map-canvas').css('z-index', '2')) {
                    console.log('-1');
                    $('#map-canvas').css('z-index', '-1');
                }*/

            }

            //$('#map-canvas').css('z-index', '-1');

        }

        return {viewModel: mapsComponentVM, template: viewHtml};
    });