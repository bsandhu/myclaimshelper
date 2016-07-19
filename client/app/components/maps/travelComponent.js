define(['jquery', 'knockout', 'KOMap', 'amplify', 'underscore',
        'app/components/summary/summaryVM',
        'text!app/components/maps/travelComponent.tmpl.html',
        'model/tags', 'model/claimEntry',
        'shared/dateUtils', 'app/utils/ajaxUtils', 'app/utils/events',
        'app/utils/responsive',
        'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBB-Qincf0sNQcsu5PzZh7znG3GiB98GRU&libraries=places&signed_in=true&v=3.exp'],

    function ($, ko, KOMap, amplify, _, SummaryVM, viewHtml, Tags, ClaimEntry, DateUtils, AjaxUtils, Events, Responsive) {
        'use strict';

        function TravelVM(params) {
            console.log('Init Travel VM');

            this.DateUtils = DateUtils;
            this.claimEntries = ko.observableArray([]);
            this.showMapLoading = ko.observable(true);

            // Clean display state since backing data has changed
            this.claimEntries.subscribe(function () {
                this.clearMarkerState();
            }, this);

            // Throttle array update to prevent duplicate render
            this.claimEntriesThrottled = ko.computed(function () {
                return this.claimEntries();
            }, this).extend({throttle: 200});

            // Draw map on data load
            this.claimEntriesThrottled.subscribe(function (newVal) {
                if (newVal && newVal.length > 0) {
                    console.log('TravelVM - re-render routes');
                    this.showMapLoading(true);
                    this.loadAndShowRoutes(newVal);
                    this.createMarker(newVal);
                    google.maps.event.trigger(this.map, 'resize');
                }
            }, this);

            this.showDirections = ko.observable(false);
            this.showLocationError = ko.observable(false);

            // Track map markers in use
            this.entryIdToMarkerData = {};
            this.entryIdToMarkerIcon = {};

            this.initMapControl();

            // ******************************
            // **** Share with SummaryVM ****
            // ******************************
            $.extend(this, SummaryVM.viewModel.prototype);
            this.tagFilter = {$in: ['visit']};
            this.navCollapsed = ko.observable(Responsive.onXSDevice());
            this.navWidth = ko.computed(function(){
                if (this.navCollapsed()) {
                    return '0';
                }
                return Responsive.onXSDevice() ? '99%' : '29%'
            }, this);

            this.mapsWidth = ko.computed(function(){
                if (this.navCollapsed()) {
                    return '99%';
                }
                return Responsive.onXSDevice() ? '99%' : '70%'
            }, this);

            this.setupFiltering();
            this.setupDragDrop();
            this.setupClaimEntryListener();
            this.searchClaimEntries();
            // End share

            this.initMapControl();
            this.setupNavListener();
        }

        /**
         * Map rendering depends on the container being displayed.
         * If the travel section is not in view,
         * trigger re-render when user navigates to it.
         */
        TravelVM.prototype.setupNavListener = function () {
            var self = this;
            amplify.subscribe(Events.SHOW_TRAVEL, this, function () {
                console.log('TravelVM - SHOW_TRAVEL ev');
                this.showMapLoading(true);
                google.maps.event.trigger(self.map, 'resize');
            });
        }

        TravelVM.prototype.collapseNav = function () {
            this.navCollapsed(!this.navCollapsed());
            google.maps.event.trigger(this.map, 'resize');
        }

        TravelVM.prototype.initMapControl = function () {
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
            this.dirService = new google.maps.DirectionsService();
            this.dirDisplay = new google.maps.DirectionsRenderer({
                suppressMarkers: true
            });

            // Listen for load finish
            var _this = this;
            google.maps.event.addListener(this.map, 'idle', function(){
                setTimeout(function(){
                    _this.showMapLoading(false);
                }, 3000);
            });
        }

        /***************************************************************/
        /* Routes */
        /***************************************************************/

        TravelVM.prototype.loadAndShowRoutes = function (entries) {
            console.log('LoadAndShowRoutes');

            var headerHeight = $('#navbar-container').height() + $('#travel-panel-heading').height() + $('#travel-toolbar').height();
            $('#map-dash').css('height', (window.innerHeight - headerHeight - 100) + 'px');

            var self = this;

            $.when(self.getStartPos.bind(self)())
                .then(function (startPos) {
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
                })
                .fail(function (err) {
                    $('#map-dash-error').css('height', screen.height - 500 + 'px');
                    self.showLocationError(true);
                })
        }

        TravelVM.prototype.showRoutes = function (start, end, via) {
            var self = this;
            self.dirDisplay.setMap(null);
            self.dirDisplay.setMap(this.map);

            var panel = document.getElementById("directionsPanel");
            panel.innerHTML = '';
            self.dirDisplay.setPanel(panel);

            via = via || [];
            self.dirService.route({
                origin: start,
                waypoints: via,
                destination: end,
                optimizeWaypoints: true,
                provideRouteAlternatives: false,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (res, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    self.dirDisplay.setDirections(res);
                } else {
                    console.error('Error fetching directions. ' + status);
                    console.error(res);
                }
            })
        }

        /***************************************************************/
        /* Markers */
        /***************************************************************/

        TravelVM.prototype.clearMarkerState = function (entry) {
            // Google marker and infoWindow have to be explicitly cleared
            _.each(_.values(this.entryIdToMarkerData), function (markerData) {
                var marker = markerData[0];
                var infoWin = markerData[1];
                infoWin ? infoWin.close() : $.noop();
                marker ? marker.setMap(null) : $.noop();
            });
            this.entryIdToMarkerData = {};
            this.entryIdToMarkerIcon = {};
        }

        /**
         * Create a unique marker icon for each date
         * @returns {*} img path to use for the given entry
         */
        TravelVM.prototype.markerIconFor = function (entry) {
            var dateGroup = DateUtils.stripTime(entry.dueDate()).getTime();
            var allIcons = [
                '/img/markerA.png', '/img/markerB.png', '/img/markerC.png', '/img/markerD.png',
                '/img/markerE.png', '/img/markerF.png', '/img/markerG.png', '/img/markerH.png'];

            // Keep track of the icons used by the date group
            var iconImg = this.entryIdToMarkerIcon[dateGroup];
            if (iconImg) {
                return iconImg;
            } else {
                var usedIcons = _.values(this.entryIdToMarkerIcon);
                var availableIcons = _.difference(allIcons, usedIcons);

                if (availableIcons.length > 0) {
                    // Remember that we are using this icon for this date
                    this.entryIdToMarkerIcon[dateGroup] = availableIcons[0];
                    return availableIcons[0];
                } else {
                    // Once we run out, re-use the last one
                    return allIcons[allIcons.length - 1];
                }
            }
        }

        TravelVM.prototype.createMarker = function (entries) {
            var self = this;

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
                    title: _.isFunction(entry.summary) ? entry.summary() : '',
                    position: entryPos,
                    icon: self.markerIconFor(entry)
                });
                var infowindow = new google.maps.InfoWindow({
                    content: '<b>' + entry.fileNum() + '/' + entry.insuranceCompanyFileNum() + '</b></br>'
                    + entry.summary() + '</br>'
                    + DateUtils.niceDate(entry.dueDate())
                    + ' @ '
                    + (entry.location ? entry.location.name() : '')
                });
                marker.addListener('click', function () {
                    infowindow.open(self.map, marker);
                });

                self.entryIdToMarkerData[entry._id()] = [marker, infowindow];
            });
        }

        TravelVM.prototype.getStartPos = function () {
            var pos;
            var self = this;
            var geocoder = new google.maps.Geocoder();
            var defer = $.Deferred();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function onSuccess(position) {
                        pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        var infowindow = new google.maps.InfoWindow({
                            disableAutoPan: true,
                            map: self.map,
                            position: pos,
                            content: 'You are here'
                        });
                        self.entryIdToMarkerData['startPos'] = [null, infowindow];
                        defer.resolve(pos);
                    },
                    function onError(err) {
                        defer.reject(err);
                    });
            } else {
                defer.reject();
            }
            return defer;
        }

        /***************************************************************/
        /* Info window */
        /***************************************************************/

        TravelVM.prototype.onSummaryRowMouseOver = function (entry, ev) {
            var data = this.entryIdToMarkerData[entry._id()];
            if (data) {
                var marker = data[0];
                var infoWin = data[1];
                infoWin.open(this.map, marker);
            } else {
                console.log('Didn\'t find marker for entry');
            }
        }

        TravelVM.prototype.onSummaryRowMouseOut = function (entry, ev) {
            var data = this.entryIdToMarkerData[entry._id()];
            if (data) {
                var infoWin = data[1];
                infoWin.close();
            } else {
                console.log('Didn\'t find marker for entry');
            }
        }

        TravelVM.prototype.onPrint = function () {
            var self = this;
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

        TravelVM.prototype.onDirections = function () {
            var self = this;
            self.showDirections(!self.showDirections());
            scroll('#directionsPanel', '#map-container');

            function scroll(element, parent) {
                $('html,body').animate(
                    {scrollTop: $(parent).scrollTop() + $(element).offset().top},
                    {duration: 'slow', easing: 'easeInQuart'});
            }
        }

        return {viewModel: TravelVM, template: viewHtml};
    });