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

            this.mapOptions = {
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
            this.markers = [];

            // Autocomplete
            var input = document.getElementById('pac-input');
            input.value = entryLocation.address;
            var options = {componentRestrictions: {country: 'us'}};
            this.autocomplete = new google.maps.places.Autocomplete(input, options);
            this.setupAutocompleteChangeListener();
            this.geolocate();
            var self = this;

            $("#dialog-message").dialog({
                autoOpen : false,
                modal : true,
                title : "",
                width : $(window).width() *.8,
                height : $(window).height() *.8,
                buttons : [{
                    html : "Close",
                    "class" : "btn btn-default",
                    click : function() {
                        $(this).dialog("close");
                    }
                }]
            });
        }

        MapsComponentVM.prototype.onShowMap = function (vm, ev) {
            $('#dialog-message').dialog('open');
            vm.dropMarkeAndRepositionMap();
            return false;
        };

        MapsComponentVM.prototype.setupAutocompleteChangeListener = function () {
            var self = this;
            // TODO Update model
        };

        MapsComponentVM.prototype.dropMarkeAndRepositionMap = function () {
            console.log('Mas autocomplete > Place changed ev');
            var self = this;

            self.mapDiv = document.getElementById('map-canvas');
            self.map = new google.maps.Map(self.mapDiv, self.mapOptions);

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
