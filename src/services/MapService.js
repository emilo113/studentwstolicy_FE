let googleMapsLoader = require('google-maps');
let google = null;
let polyline = require('@mapbox/polyline');
const $ = require('jquery');

class MapService {
	constructor(apiService, $rootScope, $compile, $timeout, dataService) {
		this.map = null;
		this.mapWrapper = document.getElementById('map');

		this.apiService = apiService;
		this.$rootScope = $rootScope;
		this.$compile = $compile;
		this.$timeout = $timeout;
		this.dataService = dataService;

		this.config = {
			center: {
				lat: 51.919438,
				lng: 19.14513599999998
			},
			disableDefaultUI: true,
			zoom: 7
		};

		this.pathColors = {
			green: '#6aaf6a',
			blue: '#4682b4',
			grey: '#808080'
		};

		this.markers = [];
		this.pathMarkers = [];
		this.lineMarkers = [];
		this.infoWindows = [];
		this.onlineVehiclesMarkers = [];
		this.onlineViewPolyline = null;
		this.polylines = [];

		this.myPositionMarker = null;
		this.myPositionCoords = null;
		this.overlay = null;

		this.$rootScope.toggleFavoritePlace = ($event, placeId) => {
			let icon = $($event.currentTarget);
			icon.removeClass('fa-heart').addClass('fa-spinner');

			this.apiService.toggleFavoritePlace(placeId)
				.then(place => {
					if (place) {
						icon.addClass('infoWindow__favorite--checked');
					} else {
						icon.removeClass('infoWindow__favorite--checked');
					}
					icon.removeClass('fa-spinner').addClass('fa-heart');
				});
		};

	}

	getGoogleMaps() {
		return new Promise(resolve => {
			googleMapsLoader.KEY = this.KEY;
			googleMapsLoader.load(loadedGoogle => {
				google = loadedGoogle;
				this.drawMap();
				resolve();
			});
		});
	}

	myPositionInit(position) {
		this.myPositionCoords = position;

		let myPositionConfig = {
			position: this.myPositionCoords,
			title: 'Moja pozycja',
			icon: {
				url: '/images/my_position.png',
				anchor: new google.maps.Point(8, 8),
				size: new google.maps.Size(32, 32),
				scaledSize: new google.maps.Size(16, 16)
			},
			optimized: false,
			map: this.map
		};

		this.myPositionMarker = new google.maps.Marker(myPositionConfig);
	}

	myPositionUpdate(position) {
		this.myPositionCoords = position;
		this.myPositionMarker.setPosition(this.myPositionCoords);
	}

	drawMap() {
		this.map = new google.maps.Map(this.mapWrapper, this.config);

		this.overlay = new google.maps.OverlayView();
		this.overlay.draw = function () {
			this.getPanes().markerLayer.id = 'markerLayer';
		};
		this.overlay.setMap(this.map);
	}

	fitBounds(boundsCoords) {
		let bounds = new google.maps.LatLngBounds();
		boundsCoords.forEach(boundCoord => {
			bounds.extend(boundCoord);
		});
		this.map.fitBounds(bounds);
	}

	addMarkersPromise(places, clearCurrent = true) {

		return new Promise((resolve, reject) => {
			if (clearCurrent) {
				this.clearMainMarkers();
			}

			places.forEach(place => {
				let marker = new google.maps.Marker({
					position: {
						lat: place.lat,
						lng: place.lng
					},
					map: this.map,
					title: place.name
				});
				marker.place = place;
				this.markers.push(marker);
			});

			this.addInfoWindowsPromise()
				.then(() => {
					resolve(this.markers);
				});
		});
	}

	showSpecifiedMarkers(departureCoordinates, arrivalCoordinates) {
		this.clearMainMarkers();

		let startIcon = {
			url: '/images/a.png',
			anchor: new google.maps.Point(12, 12),
			size: new google.maps.Size(32, 32),
			scaledSize: new google.maps.Size(24, 24)
		};

		let endIcon = {
			url: '/images/b.png',
			anchor: new google.maps.Point(12, 12),
			size: new google.maps.Size(32, 32),
			scaledSize: new google.maps.Size(24, 24)
		};

		this.markers = [
			new google.maps.Marker({
				map: this.map,
				position: departureCoordinates,
				icon: startIcon,
				title: 'Pozycja początkowa'
			}),
			new google.maps.Marker({
				map: this.map,
				position: arrivalCoordinates,
				icon: endIcon,
				title: 'Pozycja końcowa'
			})
		];
	}

	drawPolylinesPromise(route) {
		return new Promise((resolve, reject) => {
			route.steps.forEach(step => {
				this.color = this.color === this.pathColors.green ? this.pathColors.blue : this.pathColors.green;

				let polylineConfig = {
					path: this.getPath(step.polyline.points),
					geodesic: true,
					strokeOpacity: 1,
					strokeWeight: 4,
					map: this.map
				};

				if (step.travel_mode === 'WALKING') {
					polylineConfig.strokeOpacity = 0;
					polylineConfig.strokeColor = this.pathColors.grey;
					polylineConfig.icons = [
						{
							icon: {
								path: 'M 0,-1 0,1',
								strokeOpacity: 1,
								scale: 3
							},
							offset: '0',
							repeat: '15px'
						}
					];
				} else {
					this.color = this.color === this.pathColors.green ? this.pathColors.blue : this.pathColors.green;
					polylineConfig.strokeColor = this.color;

					this.drawMarkersForTransitStep(step);
				}

				let polyline = new google.maps.Polyline(polylineConfig);

				if (step.travel_mode === 'TRANSIT') {
					polyline.line_info = {
						travel_mode: step.travel_mode,
						line_number: step.transit_details.line.short_name,
						vehicle_type: step.transit_details.line.vehicle.type,
						vehicle_icon: step.transit_details.line.vehicle.icon
					};
				}
				this.polylines.push(polyline);

				resolve(this.polylines);
			});
		});
	}

	drawMarkersForTransitStep(step) {
		let stopIcon = {
			url: '/images/stop.png',
			anchor: new google.maps.Point(8, 8),
			size: new google.maps.Size(32, 32),
			scaledSize: new google.maps.Size(16, 16)
		};

		this.pathMarkers = this.pathMarkers.concat([
			new google.maps.Marker({
				map: this.map,
				position: step.transit_details.departure_stop.location,
				icon: stopIcon,
				title: step.transit_details.departure_stop.name
			}),
			new google.maps.Marker({
				map: this.map,
				position: step.transit_details.arrival_stop.location,
				icon: stopIcon,
				title: step.transit_details.arrival_stop.name
			})
		]);
	}

	drawMarkersAndPolylineForLine(lineMarkersData, selectedPolyline) {
		let stopIcon = {
			url: '/images/stop.png',
			anchor: new google.maps.Point(4, 4),
			size: new google.maps.Size(32, 32),
			scaledSize: new google.maps.Size(8, 8)
		};

		let pointsForPolyline = [];

		lineMarkersData.forEach(markerData => {
			this.lineMarkers.push(new google.maps.Marker({
				map: this.map,
				position: markerData.position,
				icon: stopIcon,
				title: markerData.name
			}));
			pointsForPolyline.push(markerData.position);
		});

		this.onlineViewPolyline = new google.maps.Polyline({
			path: pointsForPolyline,
			geodesic: true,
			strokeColor: selectedPolyline.strokeColor,
			strokeOpacity: 0.4,
			strokeWeight: 4,
			map: this.map
		});

		return this.onlineViewPolyline;
	}

	drawOnlineVehicles(vehiclesPositions, lineInfo) {
		this.clearOnlineVehicles();

		if (!vehiclesPositions || vehiclesPositions.length === 0) {
			return;
		}

		let vehicleIcon = {
			url: lineInfo.vehicle_icon,
			anchor: new google.maps.Point(12, 12),
			size: new google.maps.Size(30, 30),
			scaledSize: new google.maps.Size(24, 24)
		};

		vehiclesPositions.forEach(position => {
			this.onlineVehiclesMarkers.push(new google.maps.Marker({
				map: this.map,
				position: {
					lat: position.Lat,
					lng: position.Lon
				},
				icon: vehicleIcon,
				title: position.Lines + ' - ' + position.Time
			}));
		});
	}

	addInfoWindowsPromise() {
		return new Promise((resolve, reject) => {

			this.markers.forEach(marker => {
				let content = this.getInfoWindow(marker.place.name, marker.place.description, marker.place.id);
				let infoWindow = new google.maps.InfoWindow({
					content,
					maxWidth: 200
				});

				this.infoWindows.push(infoWindow);

				marker.addListener('mouseover', () => {
					this.infoWindows.forEach(window => {
						window.close();
					});
					infoWindow.open(this.map, marker);
				});
			});

			resolve();
		});
	}

	// Clear methods

	clearMainMarkers() {
		this.clearMarkers(this.markers);
		this.markers = [];
	}

	clearPathMarkers() {
		this.clearMarkers(this.pathMarkers);
		this.pathMarkers = [];
	}

	clearLineMarkers() {
		this.clearMarkers(this.lineMarkers);
		this.lineMarkers = [];

		if (this.onlineViewPolyline) {
			this.onlineViewPolyline.setMap(null);
			this.onlineViewPolyline = null;
		}
	}

	clearPolylines() {
		this.polylines.forEach(poly => {
			poly.setMap(null);
		});

		this.polylines = [];

		this.clearPathMarkers();
	}

	clearOnlineVehicles() {
		this.clearMarkers(this.onlineVehiclesMarkers);
		this.onlineVehiclesMarkers = [];
	}

	clearAll() {
		this.clearMainMarkers();
		this.clearPathMarkers();
		this.clearLineMarkers();
		this.clearPolylines();
		this.clearOnlineVehicles();
	}

	// Helpers

	getPath(points) {
		let result = [];
		let coordsArray = polyline.decode(points, 5);

		coordsArray.forEach(coord => {
			result.push({
				lat: coord[0],
				lng: coord[1]
			});
		});

		return result;
	}

	getFakeMarker(place) {
		return new google.maps.Marker({
			position: {
				lat: place.lat,
				lng: place.lng
			},
			title: place.name
		});
	}

	clearMarkers(markers) {
		markers.forEach(marker => {
			marker.setMap(null);
		});
	}

	getInfoWindow(title, description, placeId) {
		if (!description) {
			description = '';
		}

		let checked = '';
		if (this.dataService.isFavoritePlace(placeId)) {
			checked = 'infoWindow__favorite--checked';
		}

		return this.$compile('<div class="infoWindow">' +
			'<span class="infoWindow__title">' + title + '</span>' +
			'<p class="infoWindow__description">' + description + '</p>' +
			'<i ng-if="$root.userInfo" ng-click="$root.toggleFavoritePlace($event, ' + placeId + ')" class="fa fa-heart infoWindow__favorite ' + checked + '" aria-hidden="true"></i>' +
			'</div>')(this.$rootScope)[0];
	}
}

export default MapService;
