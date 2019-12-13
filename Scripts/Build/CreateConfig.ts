import debug_base from 'debug';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '../../package.json';
// const pkg = require('../../package.json');

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

const debug = debug_base('app:build:config');

// TODO: load config from environments
/* if (process.env.TRAVIS_PULL_REQUEST === false) {
	if (process.env.TRAVIS_BRANCH === "prod")
		env = "production";
} */

export function createConfigFile(callback, environment) {
	const configObj = {
		version: pkg.version,
		// dbVersion: 5,
		firebaseConfig: environment == 'development'
			? {
				apiKey: 'AIzaSyCnMNg4boP90ExfS-it9Eo3Knk4e-tt5g8',
				authDomain: 'canonical-debate-dev.firebaseapp.com',
				databaseURL: 'https://canonical-debate-dev.firebaseio.com',
				projectId: 'canonical-debate-dev',
				messagingSenderId: '295080303371',
				storageBucket: 'canonical-debate-dev.appspot.com',
			}
			: {
				apiKey: 'AIzaSyBvdtm4ydCO1FgyEPJX1CeEqwUxoCYGfWw',
				authDomain: 'canonical-debate-prod.firebaseapp.com',
				databaseURL: 'https://canonical-debate-prod.firebaseio.com',
				projectId: 'canonical-debate-prod',
				messagingSenderId: '265877283157',
				storageBucket: 'canonical-debate-prod.appspot.com',
			},
	};

	const newText = Object.keys(configObj).map((key) => `export const ${key} = ${JSON.stringify(configObj[key])};`).join('\n');

	const pathRel = environment === 'development' ? 'Source/BakedConfig_Dev.ts' : 'Source/BakedConfig_Prod.ts';
	const outputPath = path.join(__dirname, '..', '..', pathRel);

	const oldText = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, { encoding: 'utf8' }) : null;
	if (newText != oldText) {
		fs.writeFile(outputPath, newText, 'utf8', (err) => {
			if (err) {
				debug('Error writing config file:', err);
				if (callback) callback(err, null);
				return;
			}
			if (callback) callback();
		});
	}
}

(() => {
	createConfigFile(() => {
		debug('Config file (dev) successfully written.');
	}, 'development');
	createConfigFile(() => {
		debug('Config file (prod) successfully written.');
	}, 'production');
})();
