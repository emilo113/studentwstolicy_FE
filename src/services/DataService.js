class DataService {
	constructor() {
		this.categories = null;
		this.cities = null;

		this.favoritePlaces = [];

		this.MODERATE_STATUSES = {
			accept: 1,
			discard: 2
		};
	}

	getCityById(id) {
		return this.cities.find(city => city.id === id);
	}

	getCategoryById(id) {
		return this.categories.find(category => category.id === id);
	}

	isFavoritePlace(id) {
		return this.favoritePlaces.find(place => place.id === id);
	}
}

export default DataService;
