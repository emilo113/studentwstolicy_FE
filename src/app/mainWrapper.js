import tpl from './mainWrapper.html';
const $ = require('jquery');

require('../scss/mainWrapper.scss');

class mainWrapperController {
	constructor($scope, $rootScope, mapService, routesService, warsawApiService, geolocationService, $timeout, loaderService, apiService, dataService, mobileService) {
		'ngInject';

		this.timeout = $timeout;
		this.mapService = mapService;
		this.routesService = routesService;
		this.warsawApiService = warsawApiService;
		this.geolocationService = geolocationService;
		this.loaderService = loaderService;
		this.apiService = apiService;
		this.dataService = dataService;
		this.$scope = $scope;
		this.$rootScope = $rootScope;
		this.mobileService = mobileService;

		this.selectedCategory = null;
		this.selectedRoute = null;
		this.selectedPolyline = null;

		this.remainTimeInterval = null;
		this.onlineViewInterval = null;

		this.city = null;
	}

	$onInit() {
		this.mobileService.init();

		this.apiService.getCitiesPromise()
			.then(city => {
				this.city = city;

				this.mapInit();
			});

		this.$rootScope.$on('favoritePlace', (event, place) => {
			this.markerClick(this.mapService.getFakeMarker(place));
		});
	}

	mapInit() {
		this.geolocationService.getLocationPromise(this.city.name)
			.then(data => {
				this.city.bounds = [
					data.results[0].geometry.bounds.northeast,
					data.results[0].geometry.bounds.southwest
				];

				this.mapService.getGoogleMaps().then(() => {
					this.myPositionInit();
				});
			});
	}

	myPositionInit() {
		this.geolocationService.getPositionPromise()
			.then(geolocatorPosition => {
				this.setPosition(this.getCoordsFromGeolocatorPosition(geolocatorPosition));
			}, errorCode => {
				this.geolocationService.openLocationModal({
					successCallback: position => {
						this.setPosition(position.location);
					}
				});
			});
	}

	setPosition(position, geolocator = true) {
		this.fitBoundsForMyPosition(position);
		this.mapService.myPositionInit(position);

		if (geolocator) {
			this.geolocationService.setWatcher(newPosition => {
				this.mapService.myPositionUpdate(this.getCoordsFromGeolocatorPosition(newPosition));
			});
		}

		this.loaderService.loaderOff(2000);
	}

	fitBoundsForMyPosition(positionCoords) {
		let boundsCoords = this.city.bounds.concat(positionCoords);
		this.mapService.fitBounds(boundsCoords);
	}

	categorySelectChange(item) {
		this.selectedCategory = item;
		this.loaderService.loaderOn();

		this.apiService.getPlacesForCategoryPromise(this.city.id, item.id)
			.then(places => {
				this.mapService.addMarkersPromise(places)
					.then(markers => {

						markers.forEach(marker => {
							marker.addListener('click', () => {
								this.markerClick(marker);
							});
						});

						this.mobileService.scrollToMap();
						this.loaderService.loaderOff(1000);
					});
			});
	}

	markerClick(marker) {
		this.loaderService.loaderOn();
		this.routesService.clearTemporaryData();

		this.routesService.getAvailableConnectionsPromise(this.mapService.myPositionMarker, marker)
			.then(data => {
				this.dataService.routes = data;
				this.mapService.showSpecifiedMarkers(this.mapService.myPositionMarker.position, marker.position);

				if (this.dataService.routes.length > 0) {
					this.routesWindow.timeInterval();
				}

				this.mobileService.scrollToMap();
				this.mobileService.showRoutesMobile();

				this.loaderService.loaderOff(1000);
			});
	}

	// Methods for online view
	polylineClick(polyline) {
		if (polyline.line_info.travel_mode === 'TRANSIT' && (polyline.line_info.vehicle_type === 'BUS' || polyline.line_info.vehicle_type === 'TRAM')) {
			clearInterval(this.onlineViewInterval);
			this.mapService.clearOnlineVehicles();
			this.mapService.clearLineMarkers();

			if (this.onlineViewInterval && this.selectedPolyline === polyline) {
				this.selectedPolyline = null;
			} else {
				this.geolocationService.getStopsPromise(polyline.line_info.line_number, this.city)
					.then(stopsMarkersData => {
						let activePoly = this.mapService.drawMarkersAndPolylineForLine(stopsMarkersData, polyline);

						activePoly.addListener('click', () => {
							clearInterval(this.onlineViewInterval);
							this.mapService.clearOnlineVehicles();
							this.mapService.clearLineMarkers();
						});
					});

				this.onlineViewInterval = setInterval(() => {
					this.playOnlineView(polyline);
				}, 5000);

				this.playOnlineView(polyline);
			}
		}
	}

	playOnlineView(polyline) {
		this.selectedPolyline = polyline;

		let type = this.warsawApiService.vehiclesTypes[polyline.line_info.vehicle_type];

		this.warsawApiService.getVehiclesPositionsPromise(type, polyline.line_info.line_number)
			.then(vehiclesPositions => {
				this.mapService.drawOnlineVehicles(vehiclesPositions.result, polyline.line_info);
			});
	}

	getCoordsFromGeolocatorPosition(position) {
		return {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};
	}
}

export const MainWrapper = {
	template: tpl,
	controller: mainWrapperController
};
