class DataService {
	constructor() {
		this.categories = null;
		this.cities = null;
		this.routes = null;

		this.favoritePlaces = [];

		this.MODERATE_STATUSES = {
			accept: 1,
			discard: 2
		};
	}

	getCityById(id) {
		return this.cities.find(city => Number(city.id) === Number(id));
	}

	getCategoryById(id) {
		return this.categories.find(category => Number(category.id) === Number(id));
	}

	isFavoritePlace(id) {
		return this.favoritePlaces.find(place => Number(place.id) === Number(id));
	}
}

export default DataService;
