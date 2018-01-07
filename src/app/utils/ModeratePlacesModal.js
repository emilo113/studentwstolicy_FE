import tpl from './ModeratePlacesModal.html';

class ModeratePlacesModalController {
	constructor(apiService, $timeout, dataService, geolocationService, alertsService) {
		'ngInject';

		this.apiService = apiService;
		this.$timeout = $timeout;
		this.dataService = dataService;
		this.geolocationService = geolocationService;
		this.alertsService = alertsService;

		this.inactivePlaces = null;
		this.loading = true;
	}

	$onInit() {
		this.apiService.getInactivePlacesPromise()
			.then(places => {
				if (places.length === 0) {
					this.$timeout(() => {
						this.inactivePlaces = places;
						this.loading = false;
					});
					return;
				}

				let addressLoading = true;

				places.forEach((place, index) => {
					this.geolocationService.getLocationFromCoords(place.lat, place.lng)
						.then(location => {
							place.location = location;

							if (index === places.length - 1) {
								addressLoading = false;
							}
						});
				});

				let setPlace = () => {
					if (!addressLoading) {
						this.inactivePlaces = places;
						this.loading = false;
					} else {
						this.$timeout(() => {
							setPlace();
						}, 500);
					}
				};

				setPlace();

			});
	}

	acceptPlace(place) {
		place.loading = true;

		this.apiService.moderatePlacePromise(place.id, this.dataService.MODERATE_STATUSES.accept)
			.then(place => {
				this.alertsService.addAlert('success', 'Miejsce zostało zaakceptowane');
				this.removeFromList(place.id);
			});
	}

	editPlace(place) {
		this.apiService.openAddNewPlaceModal({
			successCallback: () => {
				this.alertsService.addAlert('success', 'Miejsce zostało zaakceptowane po edycji');
				this.removeFromList(place.id);
			},
			place
		});
	}

	removePlace(place) {
		place.loading = true;

		this.apiService.moderatePlacePromise(place.id, this.dataService.MODERATE_STATUSES.discard)
			.then(place => {
				this.alertsService.addAlert('success', 'Miejsce zostało odrzucone');
				this.removeFromList(place.id);
			});
	}

	removeFromList(id) {
		let indexToRemove = this.inactivePlaces.findIndex(place => place.id === id);
		this.inactivePlaces.splice(indexToRemove, 1);
	}

}

export const ModeratePlacesModal = {
	template: tpl,
	controller: ModeratePlacesModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
