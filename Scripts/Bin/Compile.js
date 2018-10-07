const fs = require("fs-extra");
const debug = require("debug")("app:bin:compile");
const webpackCompiler = require("../Build/WebpackCompiler");
const webpackConfig = require("../Build/WebpackConfig");
const config = require("../Config");

const paths = config.utils_paths;

const compile = ()=> {
	debug("Starting compiler.");
	return Promise.resolve()
		.then(()=>webpackCompiler(webpackConfig))
		.then(stats=> {
			if (stats.warnings.length && config.compiler_fail_on_warning) {
				throw new Error("Config set to fail on warning, exiting with status code '1'.");
			}
			debug("Copying resources to dist folder.");
			//fs.copySync(paths.client("Resources"), paths.dist());
			fs.copySync(paths.base("Resources"), paths.dist());
			fs.copySync(paths.base("Scripts/Config/dll/dll.vendor.js"), paths.dist("dll.vendor.js"));
			fs.copySync(paths.base("Scripts/Config/dll/dll.vendor.js.map"), paths.dist("dll.vendor.js.map"));
		})
		.then(()=> {
			debug("Compilation completed successfully.");
		})
		.catch(err=> {
			debug("Compiler encountered an error.", err);
			process.exit(1);
		});
};

compile();