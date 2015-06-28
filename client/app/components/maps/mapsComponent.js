define(['knockout', 'text!app/components/maps/mapsComponent.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function (ko, viewHtml) {
        'use strict';
        console.log('Maps Widget');

        function MapsComponentVM(params) {
            console.assert(params.claimEntry, 'Expecting claimEntry param');

            //$('#map-canvas').hide();
            this.showHideLinkText = ko.observable();
            this.showHideLinkText('Show map');

            this.claimEntry = params.claimEntry;
            var entryLocation = this.claimEntry.location || '';

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

            // Maps display
            this.mapDiv = document.getElementById('map-canvas');
            this.map = new google.maps.Map(this.mapDiv, mapOptions);
            this.markers = [];

            // Autocomplete
            var input = document.getElementById('pac-input');
            input.value = entryLocation.address;
            var options = {componentRestrictions: {country: 'us'}};
            this.autocomplete = new google.maps.places.Autocomplete(input, options);
            // Bias the results to the map's viewport
            this.autocomplete.bindTo('bounds', this.map);

            this.setupAutocompleteChangeListener();
            this.geolocate();
        }

        MapsComponentVM.prototype.geolocate = function () {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var geolocation = new google.maps.LatLng(
                                            position.coords.latitude,
                                            position.coords.longitude);
                    var circle = new google.maps.Circle({
                                        center: geolocation,
                                        radius: position.coords.accuracy
                    });
                    self.autocomplete.setBounds(circle.getBounds());
                });
            }
        }

        MapsComponentVM.prototype.setupAutocompleteChangeListener = function () {
            var self = this;
            google.maps.event.addListener(this.autocomplete, 'place_changed', self.dropMarkeAndRepositionMap.bind(self));
        }

        MapsComponentVM.prototype.dropMarkeAndRepositionMap = function () {
            console.log('Mas autocomplete > Place changed ev');
            var self = this;
            var place = self.autocomplete.getPlace();
            if (!place || !place.geometry) {
                return;
            }
            if (place.geometry.viewport) {
                self.map.fitBounds(place.geometry.viewport);
            } else {
                self.map.setZoom(15);
            }
            self.map.setCenter(place.geometry.location);
            self.markers.push(self.createMarker(place));
        };

        MapsComponentVM.prototype.onShowMap = function (vm, ev) {
            var mapsCanvas = $('#map-canvas');
            if(!mapsCanvas.is(':visible')) {
                mapsCanvas.slideDown('slow', redrawMap);
                this.showHideLinkText('Hide map');
            } else {
                mapsCanvas.slideUp('slow', redrawMap);
                this.showHideLinkText('Show map');
            }
            function redrawMap(){
                vm.dropMarkeAndRepositionMap();
                google.maps.event.trigger(vm.map, 'resize');
            }
        };

        MapsComponentVM.prototype.createMarker = function (place) {
            console.log('Mas autocomplete > Creating markers');

            var marker = new google.maps.Marker({
                map: this.map,
                title: place.name || place.address_components[0].long_name,
                place: {'location': place.geometry.location, query: place.name || place.address_components[0].long_name},
                attribution: {'source': 'Agent 007'}
            });
            var infowindow = new google.maps.InfoWindow({
                content: place.name
            });
            marker.addListener('click', function () {
                infowindow.open(this.map, marker);
            });
            return marker;
        };

        MapsComponentVM.prototype.setAllMarkersOnMap = function () {
            console.log('Mas autocomplete > Seting all markers');
            var self = this;
            $.each(this.markers, function (index, marker) {
                marker.setMap(self.map);
            })
        };

        MapsComponentVM.prototype.showMultiLocations = function (locations, geocoder, map, markers) {
            for (var i = 0; i < locations.length; i++) {
                geocoder.geocode({'address': locations[i]}, function (res, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        console.log(res[0]);
                        self.createMarker(res[0], map, markers);
                    }
                    else {
                        console.log('geocoder error: ' + status);
                    }
                });
            }
        };

        MapsComponentVM.prototype.routePlanner = function (start, end, middle, dirService, dirDisplay) {
            if (middle == undefined) {
                middle = [];
            }
            dirService.route({
                origin: start,
                waypoints: middle,
                destination: end,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (res, status) {
                console.log(status);
                dirDisplay.setDirections(res);
            })
        };

        return {viewModel: MapsComponentVM, template: viewHtml};
    });
