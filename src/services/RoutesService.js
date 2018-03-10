import angular from 'angular';
const $ = require('jquery');

class RoutesService {
	constructor($http, mapService) {
		'ngInject';

		this.$http = $http;
		this.mapService = mapService;

		this.currentDestinationMarker = null;
		this.lastDepartureTime = null;
	}

	getAvailableConnectionsPromise(markerA, markerB) {
		this.currentDestinationMarker = markerB;

		let parameters = {
			provideRouteAlternatives: true,
			travelMode: 'TRANSIT',
			origin: markerA.position.lat() + ',' + markerA.position.lng(),
			destination: markerB.position.lat() + ',' + markerB.position.lng()
		};

		if (this.lastDepartureTime) {
			parameters.transitOptions = {
				departureTime: this.lastDepartureTime
			};
		}

		let directionService = new this.mapService.google.maps.DirectionsService();

		return new Promise((resolve, reject) => {
			directionService.route(parameters, response => {
				resolve(this.parseData(response));
			});
		});

	}

	parseData(baseJson) {
		let result = [];
		let tmpTimestamp = angular.copy(this.lastDepartureTime);

		baseJson.routes.forEach(route => {
			if (route.legs[0].departure_time && route.legs[0].departure_time.value > this.lastDepartureTime) {
				this.lastDepartureTime = new Date(route.legs[0].departure_time.value.getTime() + 60000);
			}

			result.push(route.legs[0]);
		});

		if (tmpTimestamp === this.lastDepartureTime) {
			if (!this.lastDepartureTime) {
				this.lastDepartureTime = new Date($.now() + 3600000);
			} else {
				this.lastDepartureTime = new Date(this.lastDepartureTime.getTime() 	+ 3600000);
			}
		}

		return result;
	}

	clearTemporaryData() {
		this.currentDestinationMarker = null;
		this.lastDepartureTime = null;
	}
}

export default RoutesService;
