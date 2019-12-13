import express from 'express';
import debug_base from 'debug';
import webpack from 'webpack';
import devMiddleware from 'webpack-dev-middleware';
import connectHistoryAPIFallback from 'connect-history-api-fallback';

import { config } from './Config';
// import { config } from './Config.js';
import { webpackConfig } from './Build/WebpackConfig';
// import { webpackConfig } from 'WebpackConfig';
// import { webpackConfig } from './Build/WebpackConfig.js';

const debug = debug_base('app:server');
const app = express();
const paths = config.utils_paths;

// This rewrites all routes requests to the root /index.html file (ignoring file requests).
// If you want to implement universal rendering, you'll want to remove this middleware.
app.use(connectHistoryAPIFallback({
	rewrites: [
		{
			from: /^(.(?!\.(html|js|css|png|jpg)))+$/, // paths with these extensions will NOT be redirected to "index.html""
			to(context) {
				return '/index.html';
			},
		},
	],
}));

// Apply Webpack HMR Middleware
// ----------

if (DEV) {
	const compiler = webpack(webpackConfig);

	// compiler.apply(new webpack.ProgressPlugin({ profile: true }));
	compiler.apply(new webpack.ProgressPlugin());

	debug('Enable webpack dev and HMR middleware');
	app.use(devMiddleware(compiler, {
		publicPath: webpackConfig.output.publicPath,
		contentBase: paths.source(),
		hot: config.useHotReloading,
		quiet: config.compiler_quiet,
		noInfo: config.compiler_quiet,
		lazy: false,
		stats: config.compiler_stats,
		progress: true,
		/* watchOptions: {
			// makes-so a typescript-recompile (with multiple changed files) only triggers one webpack-recompile
			// [not needed anymore, since using tsc-watch]
			//aggregateTimeout: 2000,
			//ignored: "^(?!.*TSCompileDone\.marker)", // ignore all files other than special "TSCompileDone.marker" file
			//ignored: "**#/*",
			ignored: "!./Source_JS/TSCompileDone.marker",
		} */
	}));
	if (config.useHotReloading) {
		app.use(devMiddleware(compiler));
	}

	// Serve static assets from ~/Source/Resources since Webpack is unaware of these files.
	// This middleware doesn't need to be enabled outside of development since this directory will be copied into ~/Dist when the application is compiled.
	// app.use(express.static(paths.source("Resources")));
	app.use(express.static(paths.base('Resources')));
	// app.use(express.static(paths.dist())); // enable static loading of files in Dist, for dll.vendor.js
} else {
	debug(
		'Server is being run outside of live development mode, meaning it will '
		+ 'only serve the compiled application bundle in ~/Dist. Generally you '
		+ 'do not need an application server for this and can instead use a web '
		+ 'server such as nginx to serve your static files. See the "deployment" '
		+ 'section in the README for more information on deployment strategies.',
	);

	// Serving ~/Dist by default. Ideally these files should be served by the web server and not the app server, but this helps to demo the server in production.
	app.use(express.static(paths.dist()));
}

// module.exports = app;

const port = config.server_port;
app.listen(port);
debug(`Server is now running at http://localhost:${port}.`);
