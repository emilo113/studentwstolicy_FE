const $ = require('jquery');
let self = null;

class AlertsService {
	constructor($rootScope, $timeout) {
		'ngInject';

		self = this;

		this.$rootScope = $rootScope;
		this.$timeout = $timeout;

		this.$rootScope.alerts = [];
	}

	addAlert(type, msg) {
		this.$timeout(() => {
			this.$rootScope.alerts.push({
				type,
				msg,
				close: () => {
					return self.closeAlert(this);
				}
			});
		});
	}

	closeAlert(alert) {
		return this.closeAlertByIndex(this.$rootScope.alerts.indexOf(alert));
	}

	closeAlertByIndex(index) {
		return this.$rootScope.alerts.splice(index, 1);
	}

	clear() {
		this.$rootScope.alerts = [];
	}
}

export default AlertsService;
