/* eslint-disable func-names */
const webpack = require('webpack');
const cssnano = require('cssnano');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const debug = require('debug')('app:webpack:config');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const config = require('../Config');

const paths = config.utils_paths;
const { QUICK, USE_TSLOADER } = process.env;

const root = path.join(__dirname, '..', '..');

debug('Creating configuration.');
const webpackConfig = {
	name: 'client',
	// mode: 'none',
	mode: 'development',
	// mode: 'production',
	optimization: {
		namedModules: true,
		noEmitOnErrors: true,
	},
	target: 'web',
	devtool: config.compiler_devtool,
	module: {},
	resolve: {
		modules: [
			'node_modules',
			paths.client(),
		],
		extensions: ['.js', '.jsx', '.json'].concat(USE_TSLOADER ? ['.ts', '.tsx'] : []),
		alias: {
			react: `${paths.base()}/node_modules/react/`,
			'react-dom': `${paths.base()}/node_modules/react-dom/`,
		},
	},
};

// entry points
// ==========

const APP_ENTRY = paths.client(USE_TSLOADER ? 'Main.ts' : 'Main.js');

webpackConfig.entry = {
	app: DEV && config.useHotReloading
		? [APP_ENTRY].concat(`webpack-hot-middleware/client?path=${config.compiler_public_path}__webpack_hmr`)
		: [APP_ENTRY],
};

// bundle output
// ==========

webpackConfig.output = {
	filename: '[name].js?[hash]', // have js/css files have static names, so google can still display content (even when js file has changed)
	path: paths.dist(),
	publicPath: config.compiler_public_path,
	pathinfo: true, // include comments next to require-funcs saying path
};

// plugins
// ==========

webpackConfig.plugins = [
	// Plugin to show any webpack warnings and prevent tests from running
	function () {
		const errors = [];
		this.plugin('done', (stats) => {
			if (stats.compilation.errors.length) {
				// Log each of the warnings
				stats.compilation.errors.forEach((error) => {
					errors.push(error.message || error);
				});

				// Pretend no assets were generated. This prevents the tests from running, making it clear that there were warnings.
				//throw new Error(errors)
			}
		});
	},
	new webpack.DefinePlugin(config.globals),
	new HtmlWebpackPlugin({
		//template: paths.client('index.html'),
		//template: paths.base('Source/index.html'),
		template: './Source/index.html',
		hash: false,
		filename: 'index.html',
		inject: 'body',
		minify: false,
	}),
	function () {
		this.plugin('compilation', (compilation) => {
			compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData) => {
				// this gets the build's hash like we want
				const hash = htmlPluginData.html.match(/\.js\?([0-9a-f]+)['"]/)[1];
				htmlPluginData.html = htmlPluginData.html.replace('/dll.vendor.js?[hash]', `/dll.vendor.js?${hash}`);
				if (!htmlPluginData.html.includes(`/dll.vendor.js?${hash}`)) throw new Error('Failed to insert vendor hash.');
				return htmlPluginData;
			});
		});
	},

	new webpack.DllReferencePlugin({
		context: path.resolve(root, 'Source'),
		manifest: 'Scripts/Config/dll/vendor-manifest.json',
	}),

	// speeds up (non-incremental) builds by quite a lot // disabled atm, since it causes the website css to not be loaded on 2nd compile
	//new HardSourceWebpackPlugin(),

	new StringReplacePlugin(),
];

/*if (DEV) {
	debug('Enable plugins for live development (HMR, NoErrors).')
	webpackConfig.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin()
		//new webpack.NamedModulesPlugin()
	);
} else*/
if (PROD && !QUICK) {
	debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
	webpackConfig.plugins.push(
		//new webpack.optimize.OccurrenceOrderPlugin(),
		//new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				unused: true,
				dead_code: true,
				warnings: false,
				keep_fnames: true,
			},
			mangle: {
				keep_fnames: true,
			},
			sourceMap: true,
		}),
	);
}

// loaders
// ==========

// JavaScript / JSON
webpackConfig.module.rules = [
	{
		test: USE_TSLOADER ? /\.(jsx?|tsx?)$/ : /\.jsx?$/,
		include: [paths.client()],
		loader: 'babel-loader',
		options: config.compiler_babel,
	},
	/*{
		test: /\.json$/,
		loader: 'json-loader',
		include: [paths.base("node_modules")],
		/*include: [
			paths.base('./node_modules/ajv/lib/refs/'),
		],*#/
	},*/
];
if (USE_TSLOADER) {
	webpackConfig.module.rules.push({test: /\.tsx?$/, loader: 'ts-loader', options: { include: [paths.client()] }});
}

// file text-replacements
// ==========

/*webpackConfig.module.rules.push({
	test: /\.jsx?$/,
	loader: StringReplacePlugin.replace({replacements: [
		// optimization; replace `State(a=>a.some.thing)` with `State('some/thing')`
		{
			pattern: /State\(a ?=> ?a\.([a-zA-Z_.]+)\)/g,
			replacement: function(match, sub1, offset, string) {
				return `State('${sub1.replace(/\./g, '/')}')`;
			}
		},
	]})
});*/

// css loaders
// ==========

// We use cssnano with the postcss loader, so we tell css-loader not to duplicate minimization.
//const BASE_CSS_LOADER = 'css-loader?sourceMap&-minimize'
const BASE_CSS_LOADER = 'css-loader?-minimize';

webpackConfig.module.rules.push({
	test: /\.scss$/,
	use: [
		MiniCssExtractPlugin.loader,
		BASE_CSS_LOADER,
		{
			loader: 'postcss-loader',
			options: cssnano({
				autoprefixer: {
					add: true,
					remove: true,
					browsers: ['last 2 versions'],
				},
				discardComments: {
					removeAll: true,
				},
				discardUnused: false,
				mergeIdents: false,
				reduceIdents: false,
				safe: true,
				//sourcemap: true
			}),
		},
		{
			//loader: 'sass-loader?sourceMap',
			loader: 'sass-loader',
			options: {
				includePaths: [paths.client('styles')],
			},
		},
	],
});
webpackConfig.module.rules.push({
	test: /\.css$/,
	use: [
		MiniCssExtractPlugin.loader,
		'css-loader',
	],
});

webpackConfig.plugins.push(new MiniCssExtractPlugin({
	// Options similar to the same options in webpackOptions.output. Both options are optional.
	filename: '[name].css',
	chunkFilename: '[id].css',
}));

// file loaders
webpackConfig.module.rules.push(
	{test: /\.woff(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff"},
	{test: /\.woff2(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff2"},
	{test: /\.otf(\?.*)?$/, use: "file-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=font/opentype"},
	{test: /\.ttf(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/octet-stream"},
	{test: /\.eot(\?.*)?$/, use: "file-loader?prefix=fonts/&name=[path][name].[ext]"},
	//{test: /\.svg(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=image/svg+xml"},
	{test: /\.(png|jpg)$/, use: "url-loader?limit=8192"}
)

// Finalize Configuration
// ==========

const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
webpackConfig.plugins.push(
	new SpriteLoaderPlugin()
);
webpackConfig.module.rules.push({
	test: /\.svg$/,
	loader: "svg-sprite-loader",
});

module.exports = webpackConfig;
