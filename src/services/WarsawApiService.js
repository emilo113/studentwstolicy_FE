import angular from 'angular';
const $ = require('jquery');

class WarsawApiService {
	constructor() {
		this.url = 'https://api.um.warszawa.pl/api/action/busestrams_get/';
		this.key = 'a4b988a4-95f0-4f46-9459-c97b2131422c';
		this.vehiclesOnlineResourceId = 'f2e5503e-927d-4ad3-9500-4ab9e55deb59';
		this.stopsForLineResourceId = 'e923fa0e-d96c-43f9-ae6e-60518c9f3238';

		this.basicConf = {
			apikey: this.key
		};

		this.vehiclesTypes = {
			BUS: 1,
			TRAM: 2
		};
	}

	getBasicConf() {
		return angular.copy(this.basicConf);
	}

	getVehiclesPositionsPromise(type, line) {

		return new Promise((resolve, reject) => {
			let parameters = this.getBasicConf();

			parameters.resource_id = this.vehiclesOnlineResourceId;
			parameters.type = type;
			parameters.line = line;

			$.get({
				url: this.url,
				data: parameters,
				dataType: 'JSON',
				success: answer => {
					resolve(answer);
				}
			});
		});
	}
}

export default WarsawApiService;
