import tpl from './UserMenu.html';

require('../../scss/userMenu.scss');

class UserMenuController {
	constructor(apiService, alertsService) {
		'ngInject';

		this.apiService = apiService;
		this.alertsService = alertsService;
	}

	addPlace() {
		this.apiService.openAddNewPlaceModal({
			successCallback: () => {
				this.alertsService.addAlert('success', 'Propozycja została wysłana');
			}
		});
	}

	newPlaces() {
		this.apiService.openModeratePlacesModal();
	}

	favoritePlaces() {
		this.apiService.openFavoritePlacesModal();
	}
}

export const UserMenu = {
	template: tpl,
	controller: UserMenuController
};
