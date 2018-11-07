// 'static' imports
import 'babel-polyfill';
import 'webpack-runtime-require';
import 'Utils/General/Start_1';
import 'Utils/General/General';

import ReactDOM from 'react-dom';
import { VURL } from 'js-vextensions';

// startup (non-hot)
// ==========

// always compile-time
declare global { let ENV_COMPILE_TIME: string; }
// only compile-time if compiled for production (otherwise, can be overriden)
declare global {
	// let ENV_SHORT: string;
	let ENV: string;
	let DEV: boolean;
	// let PROD: boolean;
	// let TEST: boolean;
}

// let {version, ENV, ENV_SHORT, DEV, PROD, TEST} = DEV ? require('./BakedConfig_Dev') : require('./BakedConfig_Prod');
// if environment at compile time was not 'production' (ie. if these globals weren't set/locked), then set them here at runtime
const startURL = VURL.Parse(window.location.href);
if (ENV_COMPILE_TIME !== 'production') {
	window['ENV'] = ENV_COMPILE_TIME;
	if (startURL.GetQueryVar('env') && startURL.GetQueryVar('env') !== 'null') {
		window['ENV'] = startURL.GetQueryVar('env');
		// alert(`Using env: ${ENV}`);
		// console.log(`Using env: ${ENV}`);
		// eslint-disable-next-line
		console.log('Using env: ' + ENV); // for some reason, the template-literal version causes the "eslint-disable-line" directives below to fail
	}

	window['ENV_SHORT'] = { development: 'dev', production: 'prod' }[ENV] || ENV;
	window['DEV'] = ENV === 'development';
	window['PROD'] = ENV === 'production';
	window['TEST'] = ENV === 'test';
}

// let {version} = require('../../../package.json');
// Note: Use two BakedConfig files, so that dev-server can continue running, with its own baked-config data, even while prod-deploy occurs.
// Note: Don't reference the BakedConfig files from anywhere but here (in runtime code) -- because we want to be able to override it, below.
export const { version, firebaseConfig } = DEV ? require('./BakedConfig_Dev') : require('./BakedConfig_Prod'); // eslint-disable-line global-require

// hot-reloading
// ==========

// let hasHotReloaded = false;
function LoadHotModules() {
	// Log('Reloading hot modules...');
	require('./Main_Hot'); // eslint-disable-line global-require
}

if (DEV) {
	if (module.hot) {
		// setup hot module replacement
		module.hot.accept('./Main_Hot', () => {
			// hasHotReloaded = true;
			setTimeout(() => {
				ReactDOM.unmountComponentAtNode(document.getElementById('root'));
				LoadHotModules();
			});
		});
	}
}

LoadHotModules();
