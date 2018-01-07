import tpl from './SignUpModal.html';

class SignUpModalController {
	constructor(apiService, alertsService) {
		'ngInject';

		this.apiService = apiService;
		this.alertsService = alertsService;

		this.loading = false;
	}

	signUp() {
		this.loading = true;
		this.apiService.signUpPromise(this.user)
			.then(response => {
				this.close();
				this.alertsService.addAlert('success', response);
			}, error => {
				this.loading = false;
				this.alertsService.addAlert('danger', error);
			});
	}
}

export const SignUpModal = {
	template: tpl,
	controller: SignUpModalController,
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	}
};
