define(['knockout', 'KOMap', 'amplify',
        'text!app/components/maps/mapsDashboard.tmpl.html',
        'model/tags', 'model/claimEntry',
        'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/events',
        'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function (ko, KOMap, amplify, viewHtml, Tags, ClaimEntry, DateUtils, AjaxUtils, Events) {
        'use strict';
        console.log('Maps Dash');

        function TripPlannerVM(params) {
            this.showDirections = ko.observable(false);
            this.travelDate = ko.observable();
            this.claimEntries = ko.observableArray([]);

            this.travelDate.subscribe(function () {
                this.triggerReLoad();
            }, this);

            // Triggers initial load
            this.travelDate(DateUtils.startOfToday());
        }

        TripPlannerVM.prototype.triggerReLoad = function () {
            this.mapOptions = {
                zoom: 9,
                panControl: true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                streetViewControl: true,
                overviewMapControl: true
            };

            // Init map
            this.mapDiv = document.getElementById('map-dash');
            this.map = new google.maps.Map(this.mapDiv, this.mapOptions);
            this.loadAndShowRoutes();

            // Init Controls
            this.setupPrinting();
            this.setupDirectionsListing();
            this.setupRefresh();
        }

        TripPlannerVM.prototype.loadAndShowRoutes = function () {
            $('#map-dash').css('height', '400px');
            google.maps.event.trigger(this.map, 'resize');
            var self = this;

            $.when(self.loadEntries(), self.getStartPos())
                .done(function (entries, startPos) {
                    console.log(entries.length + ' stops on itenary');
                    // Convert to waypoint objs
                    var destinations = $.map(entries, function (entry) {
                        if (entry.location && entry.location.geometry && entry.location.geometry.location) {
                            var loc = entry.location.geometry.location;
                            return {location: new google.maps.LatLng(loc.lat(), loc.lng()), stopover: true};
                        }
                    });
                    // Start pos from Geo location
                    var start = new google.maps.LatLng(startPos.lat, startPos.lng);
                    // End from last Claim entry loc
                    var end = destinations.length > 0
                        ? destinations[destinations.length - 1].location
                        : start;
                    var waypoints = destinations.length > 1
                        ? destinations.slice(0, destinations.length - 1)
                        : [];
                    self.showRoutes(start, end, waypoints);
                    self.createMarker(entries);
                });
        }

        TripPlannerVM.prototype.createMarker = function (entries) {
            var self = this;
            var alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
            $.each(entries, function (index, entry) {
                var entryPos = null;
                if (entry.location && entry.location.geometry && entry.location.geometry.location) {
                    var loc = entry.location.geometry.location;
                    entryPos = new google.maps.LatLng(loc.lat(), loc.lng());
                }
                if (!entryPos) {
                    return;
                }
                var marker = new google.maps.Marker({
                    map: self.map,
                    title: entry.summary(),
                    position: entryPos,
                    icon: 'http://www.google.com/mapfiles/marker' + alphabets[index] + '.png'
                });
                var infowindow = new google.maps.InfoWindow({
                    content: entry.summary()
                        + '<br/><b>Visit time</b> ' + DateUtils.niceDate(entry.dueDate())
                        + '<br/><b>Address</b> ' + (entry.location ? entry.location.name() : '')
                });
                marker.addListener('click', function () {
                    infowindow.open(self.map, marker);
                });
            });
        }

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
            var self = this;
            var dirService = new google.maps.DirectionsService();
            var dirDisplay = new google.maps.DirectionsRenderer({
                suppressMarkers: true
            });
            dirDisplay.setMap(this.map);

            var panel = document.getElementById("directionsPanel");
            panel.innerHTML = '';
            dirDisplay.setPanel(panel);

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
            var self = this;
            var printDiv = document.createElement('div');
            var printControl = new PrintControl(printDiv, this.map);
            printDiv.index = 1;
            this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(printDiv);

            function PrintControl(printDiv, map) {
                printDiv.style.padding = '5px';
                var controlUI = document.createElement('div');
                controlUI.style.backgroundColor = 'white';
                controlUI.style.borderStyle = 'solid';
                controlUI.style.borderWidth = '1px';
                controlUI.style.cursor = 'pointer';
                controlUI.style.opacity = '.8';
                printDiv.appendChild(controlUI);

                var controlText = document.createElement('i');
                controlText.className = 'fa fa-print';
                controlText.innerHTML = '  Print ';
                controlText.style.padding = '5px';
                controlUI.appendChild(controlText);

                google.maps.event.addDomListener(controlUI, 'click', function () {
                    print();
                });
            }

            function print() {
                var directionsVisible = self.showDirections();
                if (!directionsVisible) {
                    self.showDirections(true);
                }
                var b = document.getElementById('map-container');
                var i = document.createElement('iframe');
                document.body.appendChild(i);
                var p = i.contentWindow;
                p.document.open();
                p.document.write('<html><head>');
                p.document.write('</head><body >');
                p.document.write(b.innerHTML);
                p.document.write('</body></html>');
                p.document.close();
                p.focus();
                p.print();
                document.body.removeChild(i);
                if (!directionsVisible) {
                    self.showDirections(false);
                }
                return false;
            }
        }

        TripPlannerVM.prototype.setupRefresh = function () {
            var self = this;
            var dirDiv = document.createElement('div');
            var refreshControl = new RefreshControl(dirDiv, this.map);
            dirDiv.index = 1;
            this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(dirDiv);

            function RefreshControl(refreshDiv, map) {
                dirDiv.style.padding = '5px';
                var controlUI = document.createElement('div');
                controlUI.style.backgroundColor = 'white';
                controlUI.style.borderStyle = 'solid';
                controlUI.style.borderWidth = '1px';
                controlUI.style.cursor = 'pointer';
                controlUI.style.opacity = '.8';
                refreshDiv.appendChild(controlUI);

                var controlText = document.createElement('i');
                controlText.className = 'fa fa-refresh';
                controlText.innerHTML = ' Refresh';
                controlText.style.padding = '5px';
                controlUI.appendChild(controlText);

                google.maps.event.addDomListener(controlUI, 'click', function () {
                    self.triggerReLoad();
                });
            }
        }

        TripPlannerVM.prototype.setupDirectionsListing = function () {
            var self = this;
            var dirDiv = document.createElement('div');
            var printControl = new DirectionsControl(dirDiv, this.map);
            dirDiv.index = 1;
            this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(dirDiv);

            function DirectionsControl(printDiv, map) {
                dirDiv.style.padding = '5px';
                var controlUI = document.createElement('div');
                controlUI.style.backgroundColor = 'white';
                controlUI.style.borderStyle = 'solid';
                controlUI.style.borderWidth = '1px';
                controlUI.style.cursor = 'pointer';
                controlUI.style.opacity = '.8';
                printDiv.appendChild(controlUI);

                var controlText = document.createElement('i');
                controlText.className = 'fa fa-car';
                controlText.innerHTML = ' Show directions';
                controlText.style.padding = '5px';
                controlUI.appendChild(controlText);

                google.maps.event.addDomListener(controlUI, 'click', function () {
                    self.showDirections(!self.showDirections());
                    controlText.innerHTML = self.showDirections() ? ' Hide directions' : ' Show directions';
                });
            }
        }

        TripPlannerVM.prototype.setupOptimization = function () {
            var self = this;
            var dirDiv = document.createElement('div');
            var optimizationControl = new OptimizationControl(dirDiv, this.map);
            dirDiv.index = 1;
            this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(dirDiv);

            function OptimizationControl(optDiv, map) {
                dirDiv.style.padding = '5px';
                var controlUI = document.createElement('div');
                controlUI.style.padding = '0px 5px 2px 5px';
                controlUI.style.backgroundColor = 'white';
                controlUI.style.borderStyle = 'solid';
                controlUI.style.borderWidth = '1px';
                controlUI.style.cursor = 'pointer';
                controlUI.style.opacity = '.8';
                optDiv.appendChild(controlUI);

                var checkBox = document.createElement('input');
                checkBox.setAttribute("type", "checkbox");
                checkBox.checked = false;

                var controlText = document.createElement('span');
                controlText.innerHTML = ' Shortest route';

                controlUI.appendChild(checkBox);
                controlUI.appendChild(controlText);

                google.maps.event.addDomListener(controlUI, 'click', function () {
                    self.shortestRoute(checkBox.checked);
                });
            }
        }

        TripPlannerVM.prototype.loadEntries = function () {
            var millisInADay = 86400000;
            var postReq =
            { query: {dueDate: {'$gte': this.travelDate().getTime(), '$lte': this.travelDate().getTime() + millisInADay},
                tag: {$in: ['visit']}},
                options: {sort: [
                    ['dueDate', 'asc']
                ]}
            };

            console.log('Loading for Travel tasks for ' + this.travelDate());
            var defer = $.Deferred();

            AjaxUtils.post(
                '/claimEntry/search',
                JSON.stringify(postReq),
                function onSuccess(res) {
                    console.log(JSON.stringify(res.data));

                    this.claimEntries(
                        $.map(res.data, function (claimEntry) {
                            return KOMap.fromJS(claimEntry, {}, new ClaimEntry());
                        }));
                    defer.resolve(this.claimEntries());
                }.bind(this),
                function onFail() {
                    defer.reject();
                });
            return defer;
        };

        return {viewModel: TripPlannerVM, template: viewHtml};
    });