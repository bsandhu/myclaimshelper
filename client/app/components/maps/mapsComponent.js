define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function mapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;

            var mapOptions = {
                center: {lat: 40.800, lng: -73.900},
                zoom: 9
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            var map2 = new google.maps.Map(document.getElementById('map-modal'), mapOptions);
            var markers = [];
            var input = document.getElementById('pac-input');
            input.value = $('#pac-input').val();


            var autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);

            function createMarker(place, map) {
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
                        createMarker(place, map);
                        createMarker(place, map2);
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
                    map2.setCenter(place.geometry.location);
                    map2.setZoom(17);
                }
                createMarker(place, map);
                createMarker(place, map2);
            });

            this.showMap = function() {
                console.log('toggle map');
                if ($('#map-canvas').css('height') == '0px') {
                    $('#map-canvas').css('height','400px');
                }
                else {$('#map-canvas').css('height','0px');}
                google.maps.event.trigger(map, 'resize');
            };

            this.mapModal = function() {
                console.log('modal view');

                setTimeout(function(){
                    google.maps.event.trigger(map2, 'resize');
                },500);
            };
        }

        return {viewModel: mapsComponentVM, template: viewHtml};
    });