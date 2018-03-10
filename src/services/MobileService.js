const $ = require('jquery');

class MobileService {
	init() {
		$(window).on('resize', () => {
			this.mobile = $(document).width() < 900;
		}).trigger('resize');
	}

	scrollToMap() {
		if (this.mobile) {
			let map = $('#map');

			if (map.offset().top > 100) {
				$('.mainWrapper').animate({scrollTop: map.offset().top}, 'slow');
			}
		}
	}

	scrollUp() {
		$('.mainWrapper').animate({scrollTop: 0}, 'slow');
	}

	showRoutesMobile() {
		if (this.mobile) {
			setTimeout(() => {
				$('.mainWrapper__routesListWrapper').addClass('slide');
			}, 200);
		}

	}

	hideRoutesMobile() {
		if (this.mobile) {
			$('.mainWrapper__routesListWrapper').removeClass('slide');
		}
	}

	mobileMapClick() {
		if (this.mobile) {
			this.hideRoutesMobile();
		}
	}

}

export default MobileService;
