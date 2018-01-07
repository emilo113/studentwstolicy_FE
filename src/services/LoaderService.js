class LoaderService {
	constructor($rootScope, $timeout) {
		'ngInject';

		this.$rootScope = $rootScope;
		this.timeout = $timeout;
	}

	loaderOn() {
		this.$rootScope.loader = true;
	}

	loaderOff(delay = 0) {
		this.timeout(() => {
			this.$rootScope.loader = false;
		}, delay);
	}

	loaderOffPromise(delay = 0) {
		return new Promise(resolve => {
			this.timeout(() => {
				this.$rootScope.loader = false;
				resolve();
			}, delay);
		});
	}
}

export default LoaderService;
