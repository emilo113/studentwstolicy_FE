import tpl from './SignInModal.html';

class SignInModalController {
	constructor(apiService, alertsService, dataService) {
		'ngInject';

		this.apiService = apiService;
		this.alertsService = alertsService;
		this.dataService = dataService;

		this.loading = false;
	}

	signIn() {
		this.loading = true;

		this.apiService.signInPromise(this.user)
			.then(response => {
				this.close();
				this.alertsService.addAlert('success', response);
			}, response => {
				this.loading = false;
				this.user = {};
				this.alertsService.addAlert('danger', response);
			});
	}

	openRegisterModal() {
		this.close();
		this.resolve.signUpCallback();
	}
}

export const SignInModal = {
	template: tpl,
	controller: SignInModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
