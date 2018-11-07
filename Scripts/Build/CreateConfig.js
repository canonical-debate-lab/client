const debug = require('debug')('app:build:config');
const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');

function createConfigFile(environment, callback) {
	const configObj = {
		version: pkg.version,
		firebaseConfig: environment === 'development'
			? {
				apiKey: 'AIzaSyCnMNg4boP90ExfS-it9Eo3Knk4e-tt5g8',
				authDomain: 'canonical-debate-dev.firebaseapp.com',
				databaseURL: 'https://canonical-debate-dev.firebaseio.com',
				storageBucket: 'canonical-debate-dev.appspot.com',
			}
			: {
				apiKey: 'AIzaSyCnMNg4boP90ExfS-it9Eo3Knk4e-tt5g8',
				authDomain: 'canonical-debate-dev.firebaseapp.com',
				databaseURL: 'https://canonical-debate-dev.firebaseio.com',
				storageBucket: 'canonical-debate-dev.appspot.com',
			},
	};

	const newText = Object.keys(configObj).map(key => `export const ${key} = ${JSON.stringify(configObj[key])};`).join('\n');

	const pathRel = environment === 'development' ? 'Source/BakedConfig_Dev.ts' : 'Source/BakedConfig_Prod.ts';
	const outputPath = path.join(__dirname, '..', '..', pathRel);

	const oldText = fs.existsSync(path) ? fs.readFileSync(outputPath, { encoding: 'utf8' }) : null;
	if (newText !== oldText) {
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

createConfigFile('development', () => debug('Config file (dev) successfully written.'));
createConfigFile('production', () => debug('Config file (prod) successfully written.'));
