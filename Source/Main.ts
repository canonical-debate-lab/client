// "static" imports
import "./Frame/General/Start_0";
import "babel-polyfill";
import "webpack-runtime-require";
//import {Require} from "webpack-runtime-require";
//import "js-vextensions/dist/ClassExtensions";
import "js-vextensions";
import "./Frame/General/ClassExtensions/CE_General";
import "./Frame/General/Start_1";
import "./Server/Server";
import "codemirror";
import "codemirror/addon/scroll/simplescrollbars";
import "./Frame/UI/CodeMirrorConfig";
//import ReactPerf from "react-addons-perf";
import "./Frame/General/Profiling";

import ReactDOM from "react-dom";
import {Store} from "redux";
import {RootState} from "./Store/index";
import {FirebaseApp} from "./Frame/Database/DatabaseHelpers";
import {GetCurrentURL} from "./Frame/General/URLs";
import {VURL} from "js-vextensions";
import Raven from "raven-js";
//import Promise from "bluebird";

// startup (non-hot)
// ==========

// always compile-time
declare global { var ENV_COMPILE_TIME: string; }
// only compile-time if compiled for production (otherwise, can be overriden)
declare global { var ENV_SHORT: string, ENV: string, DEV: boolean, PROD: boolean, TEST: boolean; }

//let {version, ENV, ENV_SHORT, DEV, PROD, TEST} = DEV ? require("./BakedConfig_Dev") : require("./BakedConfig_Prod");
// if environment at compile time was not "production" (ie. if these globals weren't set/locked), then set them here at runtime
let startURL = window.location;
if (ENV_COMPILE_TIME != "production") {
	g.ENV = ENV_COMPILE_TIME;
	if (startURL.GetQueryVar("env") && startURL.GetQueryVar("env") != "null") {
		g.ENV = startURL.GetQueryVar("env");
		//alert("Using env: " + g.ENV);
		console.log("Using env: " + ENV);
	}

	g.ENV_SHORT = {development: "dev", production: "prod"}[ENV] || ENV;
	g.DEV = ENV == "development";
	g.PROD = ENV == "production";
	g.TEST = ENV == "test";
}

//let {version} = require("../../../package.json");
// Note: Use two BakedConfig files, so that dev-server can continue running, with its own baked-config data, even while prod-deploy occurs.
// Note: Don't reference the BakedConfig files from anywhere but here (in runtime code) -- because we want to be able to override it, below.
let {version, firebaseConfig} = DEV ? require("./BakedConfig_Dev") : require("./BakedConfig_Prod");

// hot-reloading
// ==========

let hasHotReloaded = false;

if (DEV) {
	if (module.hot) {
		// setup hot module replacement
		module.hot.accept("./Main_Hot", () => {
			hasHotReloaded = true;
			setTimeout(()=> {
				ReactDOM.unmountComponentAtNode(document.getElementById("root"));
				LoadHotModules();
			});
		});
	}
}

function LoadHotModules() {
	//Log("Reloading hot modules...");
	require("./Main_Hot");
}

LoadHotModules();