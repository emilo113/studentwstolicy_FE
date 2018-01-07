import angular from 'angular';

import {TopMenu} from './app/utils/TopMenu';
import {UserMenu} from './app/utils/UserMenu';
import {MainWrapper} from './app/mainWrapper';
import {LocationModal} from './app/utils/LocationModal';
import {SignInModal} from './app/utils/SignInModal';
import {SignUpModal} from './app/utils/SignUpModal';
import {AddNewPlaceModal} from './app/utils/AddNewPlaceModal';
import {ModeratePlacesModal} from './app/utils/ModeratePlacesModal';
import {FavoritePlacesModal} from './app/utils/FavoritePlacesModal';

import 'angular-ui-router';
import routesConfig from './routes';
import './index.scss';

let MapService = require('./services/MapService').default;
let PlacesHelper = require('./services/PlacesHelper').default;
let ApiService = require('./services/ApiService').default;
let RoutesService = require('./services/RoutesService').default;
let WarsawApiService = require('./services/WarsawApiService').default;
let GeolocationService = require('./services/GeolocationService').default;
let UserService = require('./services/UserService').default;
let AlertsService = require('./services/AlertsService').default;
let LoaderService = require('./services/LoaderService').default;
let DataService = require('./services/DataService').default;

export const app = 'app';

require('./scss/utils.scss');
require('angular-sanitize');
require('angular-ui-bootstrap');
require('angular-animate');
require('ui-select');
require('ui-select/dist/select.css');
require('angular-touch');

angular
	.module(app, ['ngSanitize', 'ngAnimate', 'ngTouch', 'ui.router', 'ui.select', 'ui.bootstrap'])
	.config(routesConfig)
	.service('mapService', MapService)
	.service('placesHelper', PlacesHelper)
	.service('apiService', ApiService)
	.service('routesService', RoutesService)
	.service('warsawApiService', WarsawApiService)
	.service('geolocationService', GeolocationService)
	.service('userService', UserService)
	.service('alertsService', AlertsService)
	.service('loaderService', LoaderService)
	.service('dataService', DataService)
	.component('mainWrapper', MainWrapper)
	.component('locationModal', LocationModal)
	.component('signInModal', SignInModal)
	.component('signUpModal', SignUpModal)
	.component('addNewPlaceModal', AddNewPlaceModal)
	.component('moderatePlacesModal', ModeratePlacesModal)
	.component('favoritePlacesModal', FavoritePlacesModal)
	.component('topMenu', TopMenu)
	.component('userMenu', UserMenu)
	.run(loaderService => {
		loaderService.loaderOn();
	});
