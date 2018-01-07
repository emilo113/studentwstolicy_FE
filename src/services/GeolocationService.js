const $ = require('jquery');

class GeolocationService {
	constructor($uibModal) {
		this.$uibModal = $uibModal;

		this.KEY = 'AIzaSyA0nEprrpvg0haHFR9vZjlum7GYhmWJXAA';
		this.CITY_DATA_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

		this.ERROR_CODES = {
			NOT_SUPPORTED: 0,
			PERMISSION_DENIED: 1,
			POSITION_UNAVAILABLE: 2,
			TIMEOUT: 3,
			UNKNOWN_ERR: 4
		};
	}

	getPositionPromise() {
		return new Promise((resolve, reject) => {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(position => {
					resolve(position);
				}, error => {
					switch (error.code) {
						case error.PERMISSION_DENIED:
							reject(this.ERROR_CODES.PERMISSION_DENIED);
							break;
						case error.POSITION_UNAVAILABLE:
							reject(this.ERROR_CODES.POSITION_UNAVAILABLE);
							break;
						case error.TIMEOUT:
							reject(this.ERROR_CODES.TIMEOUT);
							break;
						case error.UNKNOWN_ERROR:
							reject(this.ERROR_CODES.UNKNOWN_ERROR);
							break;
						default:
							break;
					}
				});
			} else {
				reject(this.ERROR_CODES.NOT_SUPPORTED);
			}
		});
	}

	setWatcher(callback) {
		this.watcher = navigator.geolocation.watchPosition(callback, () => {}, {
			enableHighAccuracy: true
		});
	}

	openLocationModal(config) {
		let successCallback = config && config.successCallback ? config.successCallback : null;
		let errorCallback = config && config.errorCallback ? config.errorCallback : null;

		this.locationModal = this.$uibModal.open({
			component: 'locationModal',
			size: 400,
			resolve: {
				successCallback: () => successCallback,
				errorCallback: () => errorCallback
			}
		});
		this.locationModal.result.then(() => {}, () => {});
	}

	getLocationPromise(name) {
		return new Promise((resolve, reject) => {
			let parameters = {
				key: this.KEY,
				address: name,
				language: 'pl',
				sensor: false
			};

			$.get({
				url: this.CITY_DATA_URL,
				data: parameters,
				dataType: 'JSON',
				success: answer => {
					resolve(answer);
				}
			});
		});
	}

	getLocationFromCoordsPromise(lat, lng) {

		return new Promise((resolve, reject) => {
			let parameters = {
				key: this.KEY,
				latlng: lat + ',' + lng,
				language: 'pl'
			};

			return $.get({
				url: this.CITY_DATA_URL,
				data: parameters,
				dataType: 'JSON',
				success: answer => {
					resolve(answer);
				}
			});
		});

	}

	getLocation(val) {
		return this.getLocationPromise(val)
			.then(response => {
				return response.results.map(item => {
					return {
						name: item.formatted_address,
						location: item.geometry.location
					};
				});
			});
	}

	getLocationFromCoords(lat, lng) {
		return this.getLocationFromCoordsPromise(lat, lng)
			.then(response => {
				return {
					name: response.results[0].formatted_address,
					location: response.results[0].geometry.location
				};
			});
	}

	// Methods for getting stops coordinates for line
	getStopsPromise(line, city) {
		let url = 'http://www.ztm.waw.pl/rozklad_nowy.php?c=182&l=1&q=' + line;

		return new Promise((resolve, reject) => {
			$.get({
				url,
				success: answer => {
					let html = $(answer);
					let stopsTr = html.find('.LiniaTrasa0:first-of-type tr:not(:first-child)');
					let stopsArray = [];

					stopsTr.each((index, stopTr) => {
						stopTr = $(stopTr);
						let stopName = $.trim(stopTr.find('.pn').text() + ' ' + stopTr.find('.op').text());

						if (stopName.length > 0) {
							stopsArray.push(stopName + ' przystanek, ' + city.name);
						}
					});

					this.getStopsMarkersPromise(stopsArray)
						.then(stopsMarkersData => {
							resolve(stopsMarkersData);
						});
				}
			});
		});
	}

	getStopsMarkersPromise(stopsNameArray) {
		let markersData = new Array(stopsNameArray.length).fill(null);
		let counter = 0;
		let parameters = {
			key: this.KEY,
			language: 'pl'
		};

		let checkIfAll = () => {
			counter++;
			return counter === stopsNameArray.length;
		};

		return new Promise((resolve, reject) => {

			for (let i = 0; i < stopsNameArray.length; i++) {
				parameters.address = stopsNameArray[i];

				$.get({
					url: this.CITY_DATA_URL,
					data: parameters,
					dataType: 'JSON',
					success: data => {
						if (data.results.length === 1) {
							markersData[i] = {
								name: stopsNameArray[i],
								position: data.results[0].geometry.location
							};
						} else if (data.results.length > 1) {
							let findShortestDistance = () => {
								if (!markersData[i - 1]) {
									setTimeout(() => {
										findShortestDistance();
									}, 500);
								} else {
									let distance = this.getDistanceBetweenStops(markersData[i - 1].position, data.results[0].geometry.location);
									let indexForShortestDistance = 0;

									for (let j = 1; j < data.results.length; j++) {
										if (distance > this.getDistanceBetweenStops(markersData[i - 1].position, data.results[j].geometry.location)) {
											indexForShortestDistance = j;
										}
									}

									markersData[i] = {
										name: stopsNameArray[i],
										position: data.results[indexForShortestDistance].geometry.location
									};
								}
							};

							findShortestDistance();
						}

						if (checkIfAll()) {
							markersData = markersData.filter(data => {
								return data !== null;
							});
							resolve(markersData);
						}
					}
				});
			}
		});
	}

	getDistanceBetweenStops(position1, position2) {
		let R = 6371;
		let dLat = (position2.lat - position1.lat) * (Math.PI / 180);
		let dLon = (position2.lng - position1.lng) * (Math.PI / 180);
		let dLat1 = position1.lat * (Math.PI / 180);
		let dLat2 = position2.lat * (Math.PI / 180);

		let a = (Math.sin(dLat / 2) * Math.sin(dLat / 2)) + (Math.cos(dLat1) * Math.cos(dLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2));
		let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		let d = R * c;

		return d;
	}

}

export default GeolocationService;
