import angular from 'angular';
const $ = require('jquery');

class RoutesService {
	constructor() {
		this.url = 'https://maps.googleapis.com/maps/api/directions/json';
		this.key = 'AIzaSyA0nEprrpvg0haHFR9vZjlum7GYhmWJXAA';

		this.basicConf = {
			key: this.key,
			alternatives: true,
			mode: 'transit'
		};

		this.currentDestinationMarker = null;
		this.lastDepartureTimestamp = null;
	}

	getBasicConf() {
		return angular.copy(this.basicConf);
	}

	getAvailableConnectionsPromise(markerA, markerB) {
		this.currentDestinationMarker = markerB;

		return new Promise((resolve, reject) => {
			let parameters = this.getBasicConf();
			parameters.origin = markerA.position.lat() + ',' + markerA.position.lng();
			parameters.destination = markerB.position.lat() + ',' + markerB.position.lng();

			if (this.lastDepartureTimestamp) {
				parameters.departure_time = this.lastDepartureTimestamp;
			}

			$.get({
				url: this.url,
				data: parameters,
				dataType: 'JSON',
				success: answer => {
					resolve(this.parseData(answer));
				}
			});
		});

	}

	parseData(baseJson) {
		let result = [];
		let tmpTimestamp = angular.copy(this.lastDepartureTimestamp);

		baseJson.routes.forEach(route => {
			if (route.legs[0].departure_time) {
				this.lastDepartureTimestamp = route.legs[0].departure_time.value + 60;
			}

			result.push(route.legs[0]);
		});

		if (tmpTimestamp === this.lastDepartureTimestamp) {
			if (!this.lastDepartureTimestamp) {
				this.lastDepartureTimestamp = $.now() + 3600;
			} else {
				this.lastDepartureTimestamp += 3600;
			}
		}

		return result;
	}

	clearTemporaryData() {
		this.currentDestinationMarker = null;
		this.lastDepartureTimestamp = null;
	}
}

export default RoutesService;
