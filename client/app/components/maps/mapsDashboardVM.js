define(['knockout', 'text!app/components/maps/mapsDashboard.tmpl.html',
        'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function (ko, viewHtml) {
        'use strict';
        console.log('Maps Dash');

        function TripPlannerVM(params) {
            var entryLocation = {address: "Manhattan, NY", location: {lat: 40.99, lng: -73.9}};

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
            var mapDiv = document.getElementById('map-dash');
            this.map = new google.maps.Map(mapDiv, mapOptions);
            var options = {componentRestrictions: {country: 'us'}};

            $('#map-dash').css('height', '400px');
            google.maps.event.trigger(this.map, 'resize');
            var self = this;
            self.getStartPos()
                .done(function (startPos) {
                    self.showRoutes(
                        new google.maps.LatLng(startPos.lat, startPos.lng),
                        "Hoboken NJ",
                        //new google.maps.LatLng(51.99, -73.9),
                        [
                            {location: 'Bryant Park, Manhattan, NY', stopover: true},
                            {location: 'Far Rockaway, Queens, NY', stopover: true},
//                            {location: 'Brooklyn Heights, Brooklyn, NY', stopover: true},
//                            {location: 'Deere Park, Staten Island, NY', stopover: true},
//                            {location: 'Hicksville, NY', stopover: true},
//                            {location: 'Jackson Heights, Queens, NY', stopover: true},
//                            {location: 'White Plains, NY', stopover: true}
                        ]);

                    // multiple map input test
                    //self.showMultiLocations(['Syracuse, NY', 'Rome, NY', 'Carthage, NY']);
                })
                .fail(function(){
                    console.error('Falied to find currenrt location');
                })
        }

        TripPlannerVM.prototype.createMarker = function (place) {
            //console.log(place);
            var marker = new google.maps.Marker({
                map: this.map,
                title: place.name,
                place: {'location': place.geometry.location, query: place.address_components[0].short_name},
                attribution: {'source': 'Agent 007'}
            });
            marker.setMap(this.map);
            var infowindow = new google.maps.InfoWindow({
                content: place.name
            });
            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        }

/*
        TripPlannerVM.prototype.showMultiLocations = function (locations) {
            var self = this;
            var geocoder = new google.maps.Geocoder();
            for (var i = 0; i < locations.length; i++) {
                geocoder.geocode({'address': locations[i]}, function (res, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        console.log(res[0]);
                        self.createMarker(res[0]);
                    }
                    else {
                        console.log('geocoder error: ' + status);
                    }
                });
            }
        }
*/

        TripPlannerVM.prototype.getStartPos = function () {
            var pos;
            var geocoder = new google.maps.Geocoder();
            var defer = $.Deferred();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    pos = {lat: position.coords.latitude,
                           lng: position.coords.longitude};
                    var pan = true;
                    var infowindow = new google.maps.InfoWindow({
                        disableAutoPan: pan,
                        map: this.map,
                        position: pos,
                        content: 'You are here'
                    });
                    defer.resolve(pos);
                });
            } else {
                // Show err
                defer.reject();
            }
            return defer;
        }

        TripPlannerVM.prototype.showRoutes = function (start, end, via) {
            var dirService = new google.maps.DirectionsService();
            var dirDisplay = new google.maps.DirectionsRenderer();
            dirDisplay.setMap(this.map);
            via = via || [];
            dirService.route({
                origin: start,
                waypoints: via,
                destination: end,
                optimizeWaypoints: true,
                provideRouteAlternatives: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (res, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    dirDisplay.setDirections(res);
                } else {
                    console.error('Error fetching directions. ' + status);
                    console.error(res);
                }
            })
        }

        TripPlannerVM.prototype.setupPrinting = function () {
            var printDiv = document.createElement('div');
            var printControl = new PrintControl(printDiv, map);
            printDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_CENTER].push(printDiv);

            function PrintControl(printDiv, map) {
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

                google.maps.event.addDomListener(controlUI, 'click', function () {
                    print();
                });
            }

            function print() {
                $('body').css('visibility', 'hidden');
                $('.maps').css('visibility', 'visible', 'position', 'absolute', 'top', '0px', 'left', '0px');
                window.print();
                $('body').css('visibility', 'visible');
                $('.maps').css('position', '');
            }
        }

        return {viewModel: TripPlannerVM, template: viewHtml};
    });