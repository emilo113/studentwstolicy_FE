const $ = require('jquery');

class ApiService {
	constructor(dataService, $uibModal, userService, $rootScope) {
		this.API_URL = 'http://127.0.0.1:8000/api/';

		this.dataService = dataService;
		this.$uibModal = $uibModal;
		this.userService = userService;
		this.$rootScope = $rootScope;

		this.addNewPlaceModal = null;
		this.moderatePlacesModal = null;
		this.favoritePlacesModal = null;
	}

	signUpPromise(userData) {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'POST',
				url: this.API_URL + 'user/sign-up',
				dataType: 'JSON',
				data: userData,
				success: () => {
					resolve('Dodano nowego użytkownika. Można się zalogować.');
				},
				error: error => {
					if (error.responseJSON.errors.email) {
						reject('Wprowadzony email nie jest poprawny lub jest już w użyciu.');
					}

					reject(error.responseJSON.message);
				}
			});

		});
	}

	signInPromise(userData) {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'POST',
				url: this.API_URL + 'user/sign-in',
				dataType: 'JSON',
				data: userData,
				success: response => {
					localStorage.setItem('token', response.token);

					this.isAuthorizedPromise()
						.then(() => {
							resolve('Zostałeś poprawnie zalogowany!');
						});
				},
				error: response => {
					reject('Podane dane są niepoprawne!');
				}
			});

		});
	}

	signOutPromise() {
		return new Promise(resolve => {
			this.$rootScope.userInfo = null;
			localStorage.removeItem('token');

			resolve();
		});
	}

	isAuthorizedPromise() {

		return new Promise((resolve, reject) => {
			let token = localStorage.getItem('token');

			if (token) {
				$.ajax({
					type: 'GET',
					data: {
						token
					},
					url: this.API_URL + 'user',
					dataType: 'JSON',
					success: response => {
						this.$rootScope.userInfo = response.user;
						resolve();
					}
				});
			}
		});

	}

	getCitiesPromise() {
		return new Promise(resolve => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'cities',
				dataType: 'JSON',
				success: response => {
					this.dataService.cities = response.cities;

					resolve(response.cities[0]);
				}
			});

		});
	}

	getCategoriesPromise() {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'categories',
				dataType: 'JSON',
				success: response => {
					this.dataService.categories = response.categories;

					resolve(response.categories);
				}
			});

		});
	}

	getPlacesForCategoryPromise(cityId, categoryId) {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'places',
				dataType: 'JSON',
				data: {
					city_id: cityId,
					category_id: categoryId
				},
				success: response => {
					if (!this.$rootScope.userInfo) {
						resolve(response.places);
						return;
					}
					this.getFavoritePlacesListPromise()
						.then(places => {
							this.dataService.favoritePlaces = places;
							resolve(response.places);
						});
				}
			});

		});
	}

	addNewPlacePromise(placeData) {

		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'POST',
				url: this.API_URL + 'place?token=' + this.userService.getToken(),
				dataType: 'JSON',
				data: placeData,
				success: response => {
					resolve('Twoja propozycja została wysłana');
				}
			});

		});

	}

	moderatePlacePromise(id, status, place = null) {

		return new Promise((resolve, reject) => {
			let config = {};

			if (place) {
				config = place;
			}

			config.is_accepted = status;

			$.ajax({
				type: 'PUT',
				url: this.API_URL + 'place/' + id + '?token=' + this.userService.getToken(),
				dataType: 'JSON',
				data: config,
				success: response => {
					resolve(response.place);
				}
			});

		});

	}

	getInactivePlacesPromise() {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'places/inactive?token=' + this.userService.getToken(),
				dataType: 'JSON',
				success: response => {
					resolve(response.places);
				}
			});

		});
	}

	toggleFavoritePlace(placeId) {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'POST',
				url: this.API_URL + 'favorite-place?token=' + this.userService.getToken(),
				dataType: 'JSON',
				data: {
					place_id: placeId
				},
				success: response => {
					resolve(response.place);
				}
			});

		});
	}

	isFavoritePlacePromise(placeId) {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'favorite-place/' + placeId + '?token=' + this.userService.getToken(),
				dataType: 'JSON',
				success: response => {
					resolve(response.id);
				}
			});

		});
	}

	getFavoritePlacesListPromise() {
		return new Promise((resolve, reject) => {

			$.ajax({
				type: 'GET',
				url: this.API_URL + 'favorite-places?token=' + this.userService.getToken(),
				dataType: 'JSON',
				success: response => {
					resolve(response.places);
				}
			});

		});
	}

	openAddNewPlaceModal(config) {
		this.addNewPlaceModal = this.$uibModal.open({
			component: 'addNewPlaceModal',
			size: 400,
			resolve: {
				successCallback: () => config.successCallback,
				place: () => config.place
			}
		});

		this.addNewPlaceModal.result.then(() => {}, () => {});
	}

	openModeratePlacesModal() {
		this.moderatePlacesModal = this.$uibModal.open({
			component: 'moderatePlacesModal',
			size: 400
		});

		this.moderatePlacesModal.result.then(() => {}, () => {});
	}

	openFavoritePlacesModal() {
		this.favoritePlacesModal = this.$uibModal.open({
			component: 'favoritePlacesModal',
			size: 400
		});

		this.favoritePlacesModal.result.then(() => {}, () => {});
	}

}

export default ApiService;
