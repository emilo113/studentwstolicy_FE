const $ = require('jquery');

class UserService {
	constructor($uibModal, $rootScope) {
		'ngInject';

		this.API_URL = 'http://127.0.0.1:8000/api/';

		this.$uibModal = $uibModal;
		this.$rootScope = $rootScope;

		this.signInModal = null;
		this.signUpModal = null;
	}

	openSignInModal(config) {

		this.signInModal = this.$uibModal.open({
			component: 'signInModal',
			size: 400,
			resolve: {
				signUpCallback: () => config.signUpCallback
			}
		});
		this.signInModal.result.then(() => {}, () => {});

	}

	openSignUpModal() {
		this.signUpModal = this.$uibModal.open({
			component: 'signUpModal',
			size: 400
		});

		this.signUpModal.result.then(() => {}, () => {});
	}

	getToken() {
		return localStorage.getItem('token');
	}
}

export default UserService;
