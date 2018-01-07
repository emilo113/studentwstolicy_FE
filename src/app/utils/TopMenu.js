import tpl from './TopMenu.html';

require('../../scss/topMenu.scss');

class topMenuController {
	constructor(apiService, alertsService, loaderService, userService) {
		this.apiService = apiService;
		this.userService = userService;
		this.alertsService = alertsService;
		this.loaderService = loaderService;

		this.title = 'studentWStolicy.pl';
	}

	$onInit() {
		this.apiService.isAuthorizedPromise();
	}

	signIn() {
		this.userService.openSignInModal({
			signUpCallback: () => {
				this.signUp();
			}
		});
	}

	signOut() {
		this.loaderService.loaderOn();
		this.apiService.signOutPromise()
			.then(() => {
				this.loaderService.loaderOffPromise(2000)
					.then(() => {
						this.alertsService.addAlert('success', 'Zostałeś poprawnie wylogowany');
					});
			});
	}

	signUp() {
		this.userService.openSignUpModal();
	}
}

export const TopMenu = {
	template: tpl,
	controller: topMenuController
};
