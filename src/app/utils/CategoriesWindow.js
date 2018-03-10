import tpl from './CategoriesWindow.html';

class CategoriesWindowController {
	constructor(dataService, apiService) {
		'ngInject';

		this.dataService = dataService;
		this.apiService = apiService;
	}

	$onInit() {
		this.apiService.getCategoriesPromise();
	}

	categorySelectChange(item) {
		this.mainWrapper.categorySelectChange(item);
	}
}

export const CategoriesWindow = {
	template: tpl,
	controller: CategoriesWindowController,
	require: {
		mainWrapper: '?^'
	},
	bindings: {
		selectedCategory: '<'
	}
};
