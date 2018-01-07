class PlacesHelper {
	getCategories() {
		return [
			{
				id: 1,
				name: 'Edukacja'
			},
			{
				id: 2,
				name: 'Sport'
			}
		];
	}

	getPlacesForCategory(categoryId) {
		if (categoryId === 1) {
			return [
				{
					id: 1,
					name: 'SGGW - Rektorat',
					coordinates: {
						lat: 52.1646495,
						lng: 21.050429099999974
					}
				},
				{
					id: 2,
					name: 'UW',
					coordinates: {
						lat: 52.2403463,
						lng: 21.018601200000035
					}
				},
				{
					id: 3,
					name: 'WAT',
					coordinates: {
						lat: 52.2531574,
						lng: 20.899640599999998
					}
				}
			];
		} else if (categoryId === 2) {
			return [
				{
					id: 4,
					name: 'Warszawianka',
					coordinates: {
						lat: 52.19500230000001,
						lng: 21.026096300000063
					}
				},
				{
					id: 5,
					name: 'Stadion Narodowy',
					coordinates: {
						lat: 52.246948,
						lng: 21.043015100000048
					}
				},
				{
					id: 6,
					name: 'Tor łyżwiarski',
					coordinates: {
						lat: 52.1875359,
						lng: 21.042436299999963
					}
				}
			];
		}
	}
}

export default PlacesHelper;
