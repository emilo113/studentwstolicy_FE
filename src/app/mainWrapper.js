import tpl from './mainWrapper.html';
const $ = require('jquery');

require('../scss/mainWrapper.scss');

class mainWrapperController {
	constructor($scope, $rootScope, mapService, routesService, warsawApiService, geolocationService, $timeout, loaderService, apiService, dataService) {
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

		this.routes = null;
		this.selectedCategory = null;
		this.selectedRoute = null;
		this.selectedPolyline = null;

		this.showDetails = null;
		this.remainTimeInterval = null;
		this.onlineViewInterval = null;

		this.city = null;
	}

	$onInit() {
		this.apiService.getCitiesPromise()
			.then(city => {
				this.city = city;

				this.mapInit();
				this.categoriesInit();
			});

		$(window).on('resize', () => {
			this.mobile = $(document).width() < 900;
		}).trigger('resize');

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

	categoriesInit() {
		this.apiService.getCategoriesPromise();
	}

	timeInterval() {
		this.remainTimeInterval = setInterval(() => {
			this.updateRemainTime();
		}, 30000);
		this.updateRemainTime();
	}

	categorySelectChange(item) {
		this.loaderService.loaderOn();
		this.clearRoutes();
		this.closeRouteDetails();

		this.apiService.getPlacesForCategoryPromise(this.city.id, item.id)
			.then(places => {
				this.mapService.addMarkersPromise(places)
					.then(markers => {

						markers.forEach(marker => {
							marker.addListener('click', () => {
								this.markerClick(marker);
							});
						});

						this.scrollToMap();
						this.loaderService.loaderOff(1000);
					});
			});
	}

	markerClick(marker) {
		this.loaderService.loaderOn();
		this.routesService.clearTemporaryData();

		this.routesService.getAvailableConnectionsPromise(this.mapService.myPositionMarker, marker)
			.then(data => {
				this.routes = data;
				this.mapService.showSpecifiedMarkers(this.mapService.myPositionMarker.position, marker.position);

				if (this.routes.length > 0) {
					this.timeInterval();
				}

				this.scrollToMap();
				this.showRoutesMobile();

				this.loaderService.loaderOff(1000);
			});
	}

	// Methods for routes list

	loadMoreRoutes() {
		this.loaderService.loaderOn();

		this.routesService.getAvailableConnectionsPromise(this.mapService.myPositionMarker, this.routesService.currentDestinationMarker)
			.then(data => {
				this.routes = this.routes.concat(data);

				if (this.routes.length > 0) {
					this.updateRemainTime();
				}
				this.loaderService.loaderOff(1000);
			});
	}

	showRouteDetails(route) {
		this.selectedRoute = route;
		this.mapService.drawPolylinesPromise(route)
			.then(polylines => {

				polylines.forEach(polyline => {
					polyline.addListener('click', () => {
						this.polylineClick(polyline);
					});
				});

			});

		this.timeout(() => {
			this.showDetails = true;

			if (this.mobile) {
				this.hideRoutesMobile();
			}
		}, 250);
	}

	closeRouteDetails() {
		this.showDetails = null;
		this.mapService.clearPolylines();
		this.mapService.clearOnlineVehicles();
		this.mapService.clearLineMarkers();
		clearInterval(this.onlineViewInterval);

		this.timeout(() => {
			this.selectedRoute = null;
		}, 500);
	}

	closeRoutesList() {
		if (this.selectedCategory) {
			this.categorySelectChange(this.selectedCategory);
		} else {
			this.loaderService.loaderOn();
			this.mapService.clearAll();
			this.clearRoutes();
			this.scrollUp();
			this.loaderService.loaderOff(2000);
		}
	}

	clearRoutes() {
		this.routes = null;
		clearInterval(this.remainTimeInterval);
		this.remainTimeInterval = null;
	}

	updateRemainTime() {
		let onlyWalk = false;

		this.routes.forEach((route, index, object) => {
			if (!route.departure_time) {
				if (onlyWalk) {
					object.splice(index, 1);
				}

				onlyWalk = true;
				return;
			}

			let remainTime = Math.floor((route.departure_time.value - (Date.now() / 1000)) / 60);

			this.timeout(() => {
				route.remaining_time = remainTime;

				if (remainTime < -1) {
					object.splice(index, 1);

					if (this.routes.length < 4) {
						this.loadMoreRoutes();
					}
				} else if (remainTime < 3) {
					this.flashEffect(route);
				}
			});
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

	// Flash method
	flashEffect(route) {
		route.flash = true;

		this.timeout(() => {
			route.flash = false;
		}, 1000);
	}

	getCoordsFromGeolocatorPosition(position) {
		return {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};
	}

	// Methods for mobile

	scrollToMap() {
		if (this.mobile) {
			let map = $('#map');

			if (map.offset().top > 100) {
				$('.mainWrapper').animate({scrollTop: map.offset().top}, 'slow');
			}
		}
	}

	scrollUp() {
		$('.mainWrapper').animate({scrollTop: 0}, 'slow');
	}

	showRoutesMobile() {
		if (this.mobile) {
			setTimeout(() => {
				$('.mainWrapper__routesListWrapper').addClass('slide');
			}, 200);
		}

	}

	hideRoutesMobile() {
		if (this.mobile) {
			$('.mainWrapper__routesListWrapper').removeClass('slide');
		}
	}

	mobileMapClick() {
		if (this.mobile) {
			this.hideRoutesMobile();
		}
	}
}

export const MainWrapper = {
	template: tpl,
	controller: mainWrapperController
};
