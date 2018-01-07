import tpl from './AddNewPlaceModal.html';

class AddNewPlaceModalController {
	constructor(geolocationService, dataService, apiService, alertsService) {
		'ngInject';

		this.geolocationService = geolocationService;
		this.dataService = dataService;
		this.apiService = apiService;
		this.alertsService = alertsService;

		this.loading = false;
		this.editMode = false;
	}

	$onInit() {
		if (this.resolve.place) {
			this.editMode = true;
			this.edited = false;

			this.fetchPlaceData();
		}
	}

	fetchPlaceData() {
		this.name = this.resolve.place.name;
		this.position = this.resolve.place.location;
		this.city = this.dataService.getCityById(this.resolve.place.city_id);
		this.category = this.dataService.getCategoryById(this.resolve.place.category_id);
		this.description = this.resolve.place.description;
	}

	addNewPlace() {
		let data = this.parseData();

		this.loading = true;
		this.apiService.addNewPlacePromise(data)
			.then(message => {
				this.close();
				this.alertsService.addAlert('success', message);
				this.loading = false;
			});
	}

	acceptEdited() {
		let data = this.parseData();

		this.loading = true;
		this.apiService.moderatePlacePromise(this.resolve.place.id, this.dataService.MODERATE_STATUSES.accept, data)
			.then(response => {
				this.close();
				this.loading = false;
				this.resolve.successCallback();
			});
	}

	parseData() {
		let data = {
			name: this.name,
			category_id: this.category.id,
			city_id: this.city.id,
			lat: this.position.location.lat,
			lng: this.position.location.lng
		};

		if (this.description) {
			data.description = this.description;
		}

		return data;
	}

	isValid() {
		return this.name && this.position && this.position.location && this.city && this.category;
	}

	isEdited() {
		return this.name !== this.resolve.place.name ||
			this.position !== this.resolve.place.location ||
			this.city !== this.dataService.getCityById(this.resolve.place.city_id) ||
			this.category !== this.dataService.getCategoryById(this.resolve.place.category_id) ||
			this.description !== this.resolve.place.description;
	}
}

export const AddNewPlaceModal = {
	template: tpl,
	controller: AddNewPlaceModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
