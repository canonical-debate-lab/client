const debug = require("debug")("app:build:config");
const fs = require("fs");
const path = require("path");
const pkg = require("../../package.json");
const config = require("../Config");

// TODO: load config from environments
/*if (process.env.TRAVIS_PULL_REQUEST === false) {
	if (process.env.TRAVIS_BRANCH === "prod")
		env = "production";
}*/

function createConfigFile(callback, environment) {
	let configObj = {
		version: pkg.version,
		//dbVersion: 5,
		firebaseConfig: environment == "development"
			? {
				apiKey: "AIzaSyCnMNg4boP90ExfS-it9Eo3Knk4e-tt5g8",
				authDomain: "canonical-debate-dev.firebaseapp.com",
				databaseURL: "https://canonical-debate-dev.firebaseio.com",
				storageBucket: "canonical-debate-dev.appspot.com"
			}
			: {
				// todo
			},
	};

	let newText = Object.keys(configObj).map(key=> {
		return `export const ${key} = ${JSON.stringify(configObj[key])};`;
	}).join("\n");

	let pathRel = environment == "development" ? "Source/BakedConfig_Dev.ts" : "Source/BakedConfig_Prod.ts";
	let outputPath = path.join(__dirname, "..", "..", pathRel);

	let oldText = fs.existsSync(path) ? fs.readFileSync(outputPath, {encoding: "utf8"}) : null;
	if (newText != oldText) {
		fs.writeFile(outputPath, newText, "utf8", (err) => {
			if (err) {
				debug("Error writing config file:", err);
				if (callback) callback(err, null);
				return;
			}
			if (callback) callback();
		});
	}
}

(()=> {
	createConfigFile(()=> {
		debug("Config file (dev) successfully written.");
	}, "development");
	createConfigFile(()=> {
		debug("Config file (prod) successfully written.");
	}, "production");
})();