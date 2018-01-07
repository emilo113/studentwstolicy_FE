import tpl from './FavoritePlacesModal.html';

class FavoritePlacesModalController {
	constructor(apiService, dataService, $timeout, geolocationService, $rootScope) {
		'ngInject';

		this.apiService = apiService;
		this.dataService = dataService;
		this.$timeout = $timeout;
		this.geolocationService = geolocationService;
		this.$rootScope = $rootScope;

		this.loading = true;
	}

	$onInit() {
		this.apiService.getFavoritePlacesListPromise()
			.then(places => {
				if (places.length === 0) {
					this.$timeout(() => {
						this.dataService.favoritePlaces = places;
						this.loading = false;
					});
					return;
				}

				let counter = 0;
				let checkIfReady = counter => {
					return counter === places.length;
				};

				places.forEach((place, index) => {
					this.geolocationService.getLocationFromCoords(place.lat, place.lng)
						.then(location => {
							place.location = location;

							if (checkIfReady(++counter)) {
								this.$timeout(() => {
									this.dataService.favoritePlaces = places;
									this.loading = false;
								});
							}
						});
				});
			});
	}

	findRoutes(place) {
		this.$rootScope.$broadcast('favoritePlace', place);
		this.close();
	}
}

export const FavoritePlacesModal = {
	template: tpl,
	controller: FavoritePlacesModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
