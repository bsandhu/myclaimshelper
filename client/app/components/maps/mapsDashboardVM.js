define(['knockout', 'text!app/components/maps/mapsDashboard.tmpl.html', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function(ko, viewHtml) {
        'use strict';
        console.log('Maps Dash');

        function mapsDashboardVM(params) {
            var mapDiv;
            var entryLocation = {address:"Manhattan, NY",location:{lat:40.99, lng:-73.9}};

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

            mapDiv = document.getElementById('map-dash');
            var geocoder = new google.maps.Geocoder();
            var map = new google.maps.Map(mapDiv, mapOptions);
            var markers = [];

            var options = {componentRestrictions: {country: 'us'}};

            function createMarker(place) {
                //console.log(place);
                var marker = new google.maps.Marker({
                    map: map,
                    title: place.name,
                    place: {'location': place.geometry.location, query : place.address_components[0].short_name},
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
            }


            var pos;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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

            var dirService = new google.maps.DirectionsService();
            var dirDisplay = new google.maps.DirectionsRenderer();
            dirDisplay.setMap(map);
            function routePlanner(start, end, middle) {
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
            }

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

                google.maps.event.addDomListener(controlUI, 'click', function() {
                    print();
                });
            }

            function print() {
                $('body').css('visibility', 'hidden');
                $('.maps').css('visibility', 'visible', 'position', 'absolute', 'top','0px', 'left','0px');
                window.print();
                $('body').css('visibility', 'visible');
                $('.maps').css('position', '');
            }

            $('#map-dash').css('height', '400px');
            google.maps.event.trigger(map, 'resize');
            setTimeout(function(){
            // route demo
            routePlanner(pos, pos/*entryLocation.location*/, [
                {location: 'Bryant Park, Manhattan, NY', stopover: true},
                {location: 'Far Rockaway, Queens, NY', stopover: true},
                {location: 'Brooklyn Heights, Brooklyn, NY', stopover:true},
                {location: 'Deere Park, Staten Island, NY', stopover: true},
                {location: 'Hicksville, NY', stopover: true},
                {location: 'Jackson Heights, Queens, NY', stopover: true},
                {location: 'White Plains, NY', stopover: true}
            ]);

            // multiple map input test
            //showMultiLocations(['Syracuse, NY', 'Rome, NY', 'Carthage, NY']);
            },500);

        }

        return {viewModel: mapsDashboardVM, template: viewHtml};
    });