define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function mapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');
            this.claimEntry = params.claimEntry;

            var self = this;

            var mapDiv;
            var entryLocation = this.claimEntry.location || {address:"Manhattan, NY",location:{lat:40.99, lng:-73.9}};

            var mapOptions = {
                center: entryLocation.location,
                zoom: 9,
                panControl: true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                streetViewControl: true,
                overviewMapControl: true
            };

            var input = document.getElementById('pac-input');
            input.value = entryLocation.address;
            var modalInput = document.getElementById('modal-input');
            modalInput.value = entryLocation.address;
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

            var service = new google.maps.places.PlacesService(map);
            service.textSearch({query: input.value}, function (results, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    for (var i = 0; i < results.length; i++) {
                        var defaultPlace = results[i];
                        self.createMarker(defaultPlace, map, markers);
                    }
                }
            });

            var pos;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    pos = /*{lat:position.coords.latitude, lng:position.coords.longitude};*/ new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    var pan = true;
                    if (entryLocation.address === "Manhattan, NY") {
                        map.setCenter(pos);
                        map.setZoom(17);
                        pan = false;
                    }
                    var infowindow = new google.maps.InfoWindow({
                        disableAutoPan : pan,
                        map: map,
                        position: pos,
                        content: 'You are here'
                    });
                    return pos;
                });
            }

            var dirService = new google.maps.DirectionsService();
            var dirDisplay = new google.maps.DirectionsRenderer();
            dirDisplay.setMap(map);

            var printDiv = document.createElement('div');
            printDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_CENTER].push(printDiv);
            printDiv.style.padding = '5px';
            var controlUI = document.createElement('div');
            controlUI.style.backgroundColor = 'white';
            controlUI.style.borderStyle = 'solid';
            controlUI.style.borderWidth = '2px';
            controlUI.style.cursor = 'pointer';
            controlUI.style.textAlign = 'center';
            controlUI.title = 'Print';
            printDiv.appendChild(controlUI);
            var controlText = document.createElement('div');
            controlText.style.fontFamily = 'Arial,sans-serif';
            controlText.style.fontSize = '12px';
            controlText.style.paddingLeft = '4px';
            controlText.style.paddingRight = '4px';
            controlText.innerHTML = '<b>Print</b>';
            controlUI.appendChild(controlText);

            google.maps.event.addDomListener(controlUI, 'click', function() {
                printDiv.style.visibility = "hidden";
                $('body').css('visibility', 'hidden');
                $('.maps').css('visibility', 'visible');
                window.print();
                $('body').css('visibility', 'visible');
                printDiv.style.visibility = "visible";
            });

            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                self.setAllMap(null, markers);
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
                self.createMarker(place, map, markers);

                // route demo
                //self.routePlanner(pos, place.geometry.location, [{location:'Rome, NY',stopover:true},{location:'Watertown, NY',stopover:true},{location:'Ithaca, NY',stopover:true},{location:'Carthage, NY',stopover:true}], dirService, dirDisplay);

                // multiple map input test
                //self.showMultiLocations(['Syracuse, NY', 'Rome, NY', 'Carthage, NY'], geocoder, map, markers);
            });

            google.maps.event.addListener(modalAutocomplete, 'place_changed', function() {
                var place = modalAutocomplete.getPlace();
                self.setAllMap(null, markers);
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
                self.createMarker(place, map, markers);
            });

            this.showMap = function() {
                if ($('#map-canvas').css('height') == '0px') {
                    $('#map-canvas').css('height','400px');
                }
                else {$('#map-canvas').css('height','0px');}
                google.maps.event.trigger(map, 'resize');
            };

            this.mapModal = function() {
                setTimeout(function(){
                    google.maps.event.trigger(map, 'resize');
                },500);
            };
        }

        mapsComponentVM.prototype.createMarker = function(place, map, markers) {
            var marker = new google.maps.Marker({
                map: map,
                title: place.name || place.address_components[0].long_name,
                place: {'location': place.geometry.location, query : place.name || place.address_components[0].long_name},
                attribution: {'source': 'Agent 007'}
            });
            marker.setMap(map);
            markers.push(marker);

            var infowindow = new google.maps.InfoWindow({
                content: place.name
            });
            marker.addListener('click', function() {
                infowindow.open(map, marker);
            });
        };

        mapsComponentVM.prototype.setAllMap = function(map, markers) {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(map);
            }
        };

        mapsComponentVM.prototype.showMultiLocations = function(locations, geocoder, map, markers) {
            for (var i = 0; i < locations.length; i++) {
                geocoder.geocode( {'address':locations[i]}, function(res, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        console.log(res[0]);
                        self.createMarker(res[0], map, markers);
                    }
                    else {console.log('geocoder error: ' + status);}
                });
            }
        };

        mapsComponentVM.prototype.routePlanner = function(start, end, middle, dirService, dirDisplay) {
            if (middle == undefined) {middle = [];}
            dirService.route({
                origin: start,
                waypoints: middle,
                destination: end,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(res, status) {
                console.log(status);
                dirDisplay.setDirections(res);
            })
        };

        return {viewModel: mapsComponentVM, template: viewHtml};
    });
