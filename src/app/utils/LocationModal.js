import tpl from './LocationModal.html';

class LocationModalController {
	constructor(geolocationService, $scope) {
		'ngInject';

		this.geolocationService = geolocationService;
		this.$scope = $scope;

		this.saved = false;

		this.position = null;
		this.successCallback = null;
		this.errorCallback = null;
	}

	$onInit() {
		this.getResolveData();

		this.$scope.$on('modal.closing', event => {
			if (!this.saved) {
				event.preventDefault();
			}
		});
	}

	getResolveData() {
		this.successCallback = this.resolve.successCallback;
		this.errorCallback = this.resolve.errorCallback;
	}

	getLocation(val) {
		return this.geolocationService.getLocationPromise(val)
			.then(response => {
				return response.results.map(item => {
					return {
						name: item.formatted_address,
						location: item.geometry.location
					};
				});
			});
	}

	savePosition() {
		this.saved = true;
		this.successCallback(this.position);
		this.close();
	}

	isValid() {
		return this.position && this.position.name && this.position.location;
	}
}

export const LocationModal = {
	template: tpl,
	controller: LocationModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
