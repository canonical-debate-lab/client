const devMiddleware = require('webpack-dev-middleware');
const express = require('express');
const debug = require('debug')('app:server');
const webpack = require('webpack');
const webpackConfig = require('./Build/WebpackConfig');
const config = require('./Config');

const app = express();
const paths = config.utils_paths;

// This rewrites all routes requests to the root /index.html file. (ignoring file requests)
// If you want to implement universal rendering, you'll want to remove this middleware.
app.use(require('connect-history-api-fallback')({
	rewrites: [
		{
			from: /^(.(?!\.(html|js|css|png|jpg)))+$/, // paths with these extensions will NOT be redirected to 'index.html''
			to: () => '/index.html',
		},
	],
}));

// apply webpack HMR middleware
// ----------

if (DEV) {
	const compiler = webpack(webpackConfig);

	compiler.apply(new webpack.ProgressPlugin({ profile: true }));

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
	}));
	if (config.useHotReloading) {
		app.use(devMiddleware(compiler));
	}

	// Serve static assets from ~/Source/Resources since Webpack is unaware of these files.
	// This middleware doesn't need to be enabled outside of development since this directory will be copied into ~/dist when the application is compiled.
	// app.use(express.static(paths.source('Resources')));
	app.use(express.static(paths.root('Resources')));
	app.use(express.static(paths.root('Scripts/Config/dll'))); // enable static-loading of dll.vendor.js
	app.use(express.static(paths.dist())); // enable static loading of files in dist, for dll.vendor.js
} else {
	debug(
		'Server is being run outside of live development mode, meaning it will '
		+ 'only serve the compiled application bundle in ~/dist. Generally you '
		+ 'do not need an application server for this and can instead use a web '
		+ 'server such as nginx to serve your static files. See the \'deployment\' '
		+ 'section in the README for more information on deployment strategies.',
	);

	// Serving ~/dist by default. Ideally these files should be served by the web server and not the app server, but this helps to demo the server in production.
	app.use(express.static(paths.dist()));
}

const port = config.server_port;
app.listen(port);
debug(`Server is now running at http://localhost:${port}.`);
