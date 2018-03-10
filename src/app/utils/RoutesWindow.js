import tpl from './RoutesWindow.html';

class RoutesWindowController {
	constructor(loaderService, routesService, mapService, $timeout, mobileService, dataService) {
		'ngInject';

		this.loaderService = loaderService;
		this.routesService = routesService;
		this.mapService = mapService;
		this.timeout = $timeout;
		this.mobileService = mobileService;
		this.dataService = dataService;

		this.showDetails = null;

	}

	$onInit() {
		this.mainWrapper.routesWindow = this;
	}

	loadMoreRoutes() {
		this.loaderService.loaderOn();

		this.routesService.getAvailableConnectionsPromise(this.mapService.myPositionMarker, this.routesService.currentDestinationMarker)
			.then(data => {
				this.dataService.routes = this.dataService.routes.concat(data);

				if (this.dataService.routes.length > 0) {
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
						this.mainWrapper.polylineClick(polyline);
					});
				});

			});

		this.timeout(() => {
			this.showDetails = true;
			this.mobileService.hideRoutesMobile();
		}, 250);
	}

	closeRouteDetails() {
		this.showDetails = null;
		this.mapService.clearPolylines();
		this.mapService.clearOnlineVehicles();
		this.mapService.clearLineMarkers();
		clearInterval(this.mainWrapper.onlineViewInterval);

		this.timeout(() => {
			this.selectedRoute = null;
		}, 500);
	}

	closeRoutesList() {
		if (this.mainWrapper.selectedCategory) {
			this.mainWrapper.categorySelectChange(this.mainWrapper.selectedCategory);
		} else {
			this.loaderService.loaderOn();
			this.mapService.clearAll();
			this.mobileService.scrollUp();
			this.loaderService.loaderOff(2000);
		}

		this.mobileService.hideRoutesMobile();
		this.clearRoutes();
		this.closeRouteDetails();
	}

	clearRoutes() {
		this.dataService.routes = null;
		clearInterval(this.remainTimeInterval);
		this.remainTimeInterval = null;
	}

	updateRemainTime() {
		let onlyWalk = false;

		this.dataService.routes.forEach((route, index, object) => {
			if (!route.departure_time) {
				if (onlyWalk) {
					object.splice(index, 1);
				}

				onlyWalk = true;
				return;
			}

			let remainTime = Math.floor(((route.departure_time.value.getTime() - Date.now()) / 1000) / 60);

			this.timeout(() => {
				route.remaining_time = remainTime;

				if (remainTime < -1) {
					object.splice(index, 1);

					if (this.dataService.routes.length < 4) {
						this.loadMoreRoutes();
					}
				} else if (remainTime < 3) {
					this.flashEffect(route);
				}
			});
		});
	}

	timeInterval() {
		this.remainTimeInterval = setInterval(() => {
			this.updateRemainTime();
		}, 30000);
		this.updateRemainTime();
	}

	flashEffect(route) {
		route.flash = true;

		this.timeout(() => {
			route.flash = false;
		}, 1000);
	}

}

export const RoutesWindow = {
	template: tpl,
	controller: RoutesWindowController,
	require: {
		mainWrapper: '?^'
	},
	bindings: {
		selectedRoute: '<'
	}
};
