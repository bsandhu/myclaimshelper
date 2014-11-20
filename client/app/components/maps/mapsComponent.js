define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function mapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;

            var mapDiv;
            var dbPlace;

            var mapOptions = {
                center: {lat: 40.800, lng: -73.900},
                zoom: 9
            };

            var input = document.getElementById('pac-input');
            var modalInput = document.getElementById('modal-input');
            var modalStatus = false;

            if ($('#modal-button').css('display') === 'none') {
                mapDiv = document.getElementById('map-canvas');
            } else {
                mapDiv = document.getElementById('map-modal');
                modalStatus = true;
            }

            var geocoder = new google.maps.Geocoder();
            var map = new google.maps.Map(mapDiv, mapOptions);
            var markers = [];

            var options = {componentRestrictions: {country: 'us'}};
            var autocomplete = new google.maps.places.Autocomplete(input, options);
            autocomplete.bindTo('bounds', map);
            var modalAutocomplete = new google.maps.places.Autocomplete(modalInput, options);
            modalAutocomplete.bindTo('bounds', map);

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
                        var defaultPlace = results[i];
                        createMarker(defaultPlace);
                    }
                }
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    map.setCenter(pos);
                    map.setZoom(17);
                    var infowindow = new google.maps.InfoWindow({
                        map: map,
                        position: pos,
                        content: 'You are here'
                    });
                });
            }

            function setAllMap(map) {
                for (var i = 0; i < markers.length; i++) {
                    markers[i].setMap(map);
                }
            }

            function showMultiLocations(locations) {

                for (var i = 0; i < locations.length; i++) {
                    geocoder.geocode( {'address':locations[i]}, function(res, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            console.log(res[0]);
                            createMarker(res[0]);
                        }
                        else {console.log('geocoder error: ' + status);}
                    });
                }
            }

            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                setAllMap(null);
                markers = [];
                if (!place.geometry) {
                    return;
                }
                if (!modalStatus) {
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setZoom(17);
                    }
                }
                map.setCenter(place.geometry.location);
                createMarker(place);
                //$('#modalAutocomplete').val(place);
            });

            google.maps.event.addListener(modalAutocomplete, 'place_changed', function() {
                var place = modalAutocomplete.getPlace();
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
                //$('#autocomplete').val(place);
            });

            this.showMap = function() {
                if ($('#map-canvas').css('height') == '0px') {
                    $('#map-canvas').css('height','400px');
                }
                else {$('#map-canvas').css('height','0px');}
                google.maps.event.trigger(map, 'resize');

                // test of multiple map inputs
                //showMultiLocations(['Syracuse, NY', 'Rome, NY', 'Carthage, NY']);
            };

            this.mapModal = function() {
                setTimeout(function(){
                    google.maps.event.trigger(map, 'resize');
                },500);
            };
        }

        return {viewModel: mapsComponentVM, template: viewHtml};
    });