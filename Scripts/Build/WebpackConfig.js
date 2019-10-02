const webpack = require('webpack');
const cssnano = require('cssnano');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const debug = require('debug')('app:webpack:config');
const path = require('path');
const fs = require('fs');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const config = require('../Config');
const { CyclicDependencyChecker } = require('webpack-dependency-tools');
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// const AutoDllPlugin = require("autodll-webpack-plugin");
// require('js-vextensions'); // maybe temp; used atm for "".AsMultiline function

const paths = config.utils_paths;
const { QUICK, USE_TSLOADER, OUTPUT_STATS } = process.env;

const root = path.join(__dirname, '..', '..');

debug('Creating configuration.');
const webpackConfig = {
	name: 'client',
	mode: 'development',
	optimization: {
		namedModules: true, // we have path-info anyway (and causes problems when inconsistent between bundles)
		noEmitOnErrors: true,
	},
	target: 'web',
	devtool: config.compiler_devtool,
	resolve: {
		modules: [
			// 'node_modules', // commented; thus we ignore the closest-to-import-statement node_modules folder, instead we: [...]
			paths.base('node_modules'), // [...] always get libraries from the root node_modules folder
			paths.client(),
		],
		// extensions: [".js", ".jsx", ".json"].concat(USE_TSLOADER ? [".ts", ".tsx"] : []),
		extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'], // always accept ts[x], because there might be some in node_modules (eg. vwebapp-framework)
		alias: {
			// "react": __dirname + "/node_modules/react/",
			react: paths.base('node_modules', 'react'),
			'react-dom': paths.base('node_modules', 'react-dom'),
			// "@types/react": paths.base() + "/node_modules/@types/react/",
		},
	},
	module: {},
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
				// throw new Error(errors)
			}
		});
	},
	new webpack.DefinePlugin(config.globals),
	new HtmlWebpackPlugin({
		template: './Source/index.html',
		hash: false,
		filename: 'index.html',
		inject: 'body',
		minify: false,
	}),

	// speeds up (non-incremental) builds by quite a lot // disabled atm, since causes webpack crash after every 30 or so rebuilds!
	/* new HardSourceWebpackPlugin({
		configHash: function(webpackConfig) {
			const setIn = require("lodash/fp/set");
			let indexOfStringReplaceRule = webpackConfig.module.rules.findIndex(a=>a.loader && a.loader.includes && a.loader.includes("string-replace-webpack-plugin\\loader.js?id="));
			let config_excludeVolatiles = webpackConfig;
			//config_excludeVolatiles = WithDeepSet(config_excludeVolatiles, ["module", "rules", indexOfStringReplaceRule, "loader"], null);
			config_excludeVolatiles = setIn(`module.rules.${indexOfStringReplaceRule}.loader`, null, config_excludeVolatiles);
			return require("node-object-hash")({sort: false}).hash(config_excludeVolatiles);
		},
		// if all caches combined are over the size-threshold (in bytes), then any caches older than max-age (in ms) are deleted
		/*cachePrune: {
			maxAge: 2 * 24 * 60 * 60 * 1000,
			sizeThreshold: 50 * 1024 * 1024
		},*#/
	}), */

	new StringReplacePlugin(),
];

/* if (DEV) {
	debug('Enable plugins for live development (HMR, NoErrors).');
	webpackConfig.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		// new webpack.NamedModulesPlugin()
	);
} else */ if (PROD && !QUICK) {
	debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
	webpackConfig.plugins.push(
		// new webpack.optimize.OccurrenceOrderPlugin(),
		// new webpack.optimize.DedupePlugin(),
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

// rules
// ==========

// JavaScript / JSON
webpackConfig.module.rules = [
	{
		test: /\.(jsx?|tsx?)$/,
		// we have babel ignore most node_modules (ie. include them raw), but we tell it to transpile the vwebapp-framework typescript files
		// include: [paths.client(), paths.base("node_modules", "vwebapp-framework")],
		include: [paths.client(), fs.realpathSync(paths.base('node_modules', 'vwebapp-framework'))],
		loader: 'babel-loader',
		query: {
			presets: [
				[
					'@babel/env',
					{
						loose: true,
						exclude: DEV ? ['babel-plugin-transform-async-to-generator', 'babel-plugin-transform-regenerator'] : [],
					},
				],
				'@babel/react',
			],
		},
	},
];

// most ts files will be transpiled by tsc into Source_JS, but the remainder (in node_modules), use ts-loader for
// if (USE_TSLOADER) {
// webpackConfig.module.rules.push({test: /\.tsx?$/, use: "awesome-typescript-loader"});
// webpackConfig.module.rules.push({test: /\.tsx?$/, loader: "ts-loader", options: {include: [paths.client()]}});
webpackConfig.module.rules.push({ test: /\.tsx?$/, loader: 'ts-loader' });

// file text-replacements
// ==========

function AddStringReplacement(fileRegex, replacements, minCallCount = 1) {
	const replacementCallCounts = replacements.map(() => 0);
	function VerifyReplacementsCalled() {
		const undercalledIndex = replacementCallCounts.findIndex(callCount => callCount < minCallCount);
		const undercalledReplacement = replacements[undercalledIndex];
		if (undercalledIndex != -1) {
			throw new Error(`

				A text-replacement was not called as many times as it should have been.
				File: ${fileRegex}
				Pattern (#${undercalledIndex}): ${undercalledReplacement.pattern}
				Min call count: ${minCallCount}
				Actual call acount: ${replacementCallCounts[undercalledIndex]}

				Ensure that you have the correct version of the npm package installed.
			`);
		}
	}

	const replacements_final = replacements.map((oldReplacement, index) => {
		return {
			...oldReplacement,
			replacement: (...args) => {
				replacementCallCounts[index]++;
				return oldReplacement.replacement.apply(this, args);
			},
		};
	}).concat({
		pattern: /(.|\n)+/g,
		replacement: (match) => {
			VerifyReplacementsCalled();
			return match;
		},
	});
	webpackConfig.module.rules.push({
		test: fileRegex,
		loader: StringReplacePlugin.replace({ replacements: replacements_final }),
	});
}

AddStringReplacement(/\.jsx?$/, [
	// optimization; replace `State(a=>a.some.thing)` with `State("some/thing")`
	{
		pattern: /State\(a ?=> ?a\.([a-zA-Z_.]+)\)/g,
		replacement(match, sub1, offset, string) {
			return `State("${sub1.replace(/\./g, '/')}")`;
		},
	},
	/* {
		pattern: /State\(function \(a\) {\s+return a.([a-zA-Z_.]+);\s+}\)/g,
		replacement: function(match, sub1, offset, string) {
			Log("Replacing...");
			return `State("${sub1.replace(/\./g, "/")}")`;
		}
	}, */
], 0);

// AddStringReplacement(/connected-(draggable|droppable).js$/, [
AddStringReplacement(/react-beautiful-dnd.esm.js$/, [
	// note: the replacements below may need updating, since the library was updated since the replacements were written
	// make react-beautiful-dnd import react-redux using a relative path, so it uses its local v5 instead of the project's v6
	/* {
		pattern: /from 'react-redux';/g,
		replacement: (match, offset, str) => "from '../node_modules/react-redux';",
	}, */
	// make lib support nested-lists better (from: https://github.com/atlassian/react-beautiful-dnd/pull/636)
	{
		pattern: /var getDroppableOver\$1 = (.|\n)+?(?=var withDroppableScroll)/,
		replacement: () => {
			return `
				var getDroppableOver$1 = (function(args) {
					var target = args.target, droppables = args.droppables;
					var maybe = toDroppableList(droppables)
						.filter(droppable => {
							if (!droppable.isEnabled) return false;
							var active = droppable.subject.active;
							if (!active) return false;
							return isPositionInFrame(active)(target);
						})
						.sort((a, b) => {
							// if draggable is over two lists, and one's not as tall, have it prioritize the list that's not as tall
							/*if (a.client.contentBox[a.axis.size] < b.client.contentBox[b.axis.size]) return -1;
							if (a.client.contentBox[a.axis.size] > b.client.contentBox[b.axis.size]) return 1;
							return 0;*/
							if (a.client.contentBox[a.axis.size] != b.client.contentBox[b.axis.size]) {
								return a.client.contentBox[a.axis.size] - b.client.contentBox[b.axis.size]; // ascending
							}

							// if draggable is over two lists, have it prioritize the list farther to the right
							/*if (a.client.contentBox.left != b.client.contentBox.left) {
								return a.client.contentBox.left - b.client.contentBox.left; // ascending
							}*/

							// if draggable is over multiple lists, have it prioritize the list whose center is closest to the mouse
							/*var aDist = Math.hypot(target.x - a.client.contentBox.center.x, target.y - a.client.contentBox.center.y);
							var bDist = Math.hypot(target.x - b.client.contentBox.center.x, target.y - b.client.contentBox.center.y);
							return aDist - bDist; // ascending*/

							// prioritize the list farther to the right/bottom (evaluated as distance from union-rect top-left)
							var unionRect = {x: Math.min(a.client.contentBox.left, b.client.contentBox.left), y: Math.min(a.client.contentBox.top, b.client.contentBox.top)};
							var aDist = Math.hypot(unionRect.x - a.client.contentBox.center.x, unionRect.y - a.client.contentBox.center.y);
							var bDist = Math.hypot(unionRect.x - b.client.contentBox.center.x, unionRect.y - b.client.contentBox.center.y);
							return -(aDist - bDist); // descending
						})
						.find(droppable => !!droppable);
					return maybe ? maybe.descriptor.id : null;
				});
			`.trim();
		},
	},
	// disable map edge-scrolling, when option is set
	{
		// pattern: /var canScrollDroppable = function canScrollDroppable\(droppable, change\) {/,
		pattern: /var canScrollDroppable = function canScrollDroppable.+/,
		replacement: () => `
			var canScrollDroppable = function canScrollDroppable(droppable, change) {
				if (window.LockMapEdgeScrolling()) return false;
		`.trim(),
	},
]);

// react
AddStringReplacement(/ReactDebugTool.js/, [
	{
		// expose ReactDebugTool.getTreeSnapshot
		pattern: /module.exports = /g,
		replacement: (match, offset, string) => Clip(`
ReactDebugTool.getTreeSnapshot = getTreeSnapshot;

module.exports = 
			`),
	},
]);

// react-redux
AddStringReplacement(/connectAdvanced.js/, [
	// remove try-catch blocks
	{ pattern: /try {/g, replacement: () => '//try {' },
	{
		pattern: /} catch(.+?){/g,
		replacement: (match, p1) => `//} catch${p1}{
			if (0) {`,
	},
]);
AddStringReplacement(/wrapMapToProps.js/, [
	// make WrappedComponent (the class) accessible as "this.WrappedComponent" from within Connect (FirebaseConnect.ts), and Connect functions
	{
		pattern: 'proxy.dependsOnOwnProps = true;',
		replacement: match => `${match} proxy.WrappedComponent = _ref.WrappedComponent;`,
	},
]);

// redux
AddStringReplacement(/createStore.js/, [
	// optimize redux so that if a reducer does not change the state at all, then the store-subscribers are not notified
	{
		pattern: 'currentState = currentReducer(currentState, action)',
		replacement: match => `var oldState = currentState; ${match}`,
	},
	{
		pattern: 'for (var i = 0; i < listeners.length; i++) {',
		replacement: match => `if (currentState !== oldState) ${match}`,
	},
]);


// make all Object.defineProperty calls leave the property configurable (probably better to just wrap the Object.defineProperty function)
/* AddStringReplacement(/index\.js$/, [
	{
		pattern: /enumerable: true,/g,
		replacement(match, offset, string) {
			return `${match} configurable: true,`;
		},
	},
]); */

// css loaders
// ==========

// We use cssnano with the postcss loader, so we tell css-loader not to duplicate minimization.
// const BASE_CSS_LOADER = "css-loader?sourceMap&-minimize"
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
				// sourcemap: true
			}),
		},
		{
			// loader: "sass-loader?sourceMap",
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


// File loaders
/* eslint-disable */
webpackConfig.module.rules.push(
	{test: /\.woff(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff"},
	{test: /\.woff2(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff2"},
	{test: /\.otf(\?.*)?$/, use: "file-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=font/opentype"},
	{test: /\.ttf(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/octet-stream"},
	{test: /\.eot(\?.*)?$/, use: "file-loader?prefix=fonts/&name=[path][name].[ext]"},
	//{test: /\.svg(\?.*)?$/, use: "url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=image/svg+xml"},
	{test: /\.(png|jpg)$/, use: "url-loader?limit=8192"}
)
/* eslint-enable */

// Finalize Configuration
// ==========

webpackConfig.plugins.push(
	new SpriteLoaderPlugin(),
);
webpackConfig.module.rules.push({
	test: /\.svg$/,
	loader: 'svg-sprite-loader',
});

if (OUTPUT_STATS) {
	let firstOutput = true;
	webpackConfig.plugins.push(
		{
			apply(compiler) {
				compiler.plugin('after-emit', (compilation, done) => {
					const stats = compilation.getStats().toJson({
						hash: false,
						version: false,
						timings: true,
						assets: false,
						chunks: false,
						chunkModules: false,
						chunkOrigins: false,
						modules: true,
						cached: false,
						reasons: true,
						children: false,
						source: false,
						errors: false,
						errorDetails: false,
						warnings: false,
						publicPath: false,
					});
					fs.writeFile(`./Tools/Webpack Profiling/Stats${firstOutput ? '' : '_Incremental'}.json`, JSON.stringify(stats));

					let modules_justTimings = stats.modules.map((mod) => {
						const timings = mod.profile;
						return {
							name: mod.name,
							totalTime: (timings.factory | 0) + (timings.building | 0) + (timings.dependencies | 0),
							timings,
						};
					});
					modules_justTimings = SortArrayDescending(modules_justTimings, a => a.totalTime);

					const modules_justTimings_asMap = {};
					for (const mod of modules_justTimings) {
						modules_justTimings_asMap[mod.name] = mod;
						delete mod.name;
					}
					fs.writeFile(`./Tools/Webpack Profiling/ModuleTimings${firstOutput ? '' : '_Incremental'}.json`, JSON.stringify(modules_justTimings_asMap, null, 2));

					firstOutput = false;

					done();
				});

				// uncomment this to output the module-info that can be used later to see cyclic-dependencies, using AnalyzeDependencies.bat
				/* compiler.plugin("done", function(stats) {
					let moduleInfos = {};
					for (let module of stats.compilation.modules) {
						//if (!module.resource) continue;
						//if (module.dependencies == null) continue;
						let moduleInfo = {};
						//moduleInfo.name = module.name;
						if (module.resource) {
							moduleInfo.name = path.relative(process.cwd(), module.resource).replace(/\\/g, "/");
						}
						if (module.dependencies) {
							moduleInfo.dependencies = module.dependencies.filter(a=>a.module).map(a=>a.module.id);
						}
						moduleInfos[module.id] = moduleInfo;
					}
					fs.writeFile(`./Tools/Webpack Profiling/ModuleInfo.json`, JSON.stringify(moduleInfos));
				}); */
			},
		},
	);

	/* let CircularDependencyPlugin = require("circular-dependency-plugin");
	webpackConfig.plugins.push(
		new CircularDependencyPlugin({exclude: /node_modules/})
	); */

	webpackConfig.plugins.push(
		new CyclicDependencyChecker(),
	);

	webpackConfig.profile = true;
	webpackConfig.stats = 'verbose';
}

function SortArray(array, valFunc = (item, index) => item) {
	return StableSort(array, (a, b, aIndex, bIndex) => Compare(valFunc(a, aIndex), valFunc(b, bIndex)));
}
function SortArrayDescending(array, valFunc = (item, index) => item) {
	return SortArray(array, (item, index) => -valFunc(item, index));
}
function StableSort(array, compareFunc) { // needed for Chrome
	const array2 = array.map((item, index) => ({ index, item }));
	array2.sort((a, b) => {
		const r = compareFunc(a.item, b.item, a.index, b.index);
		return r != 0 ? r : Compare(a.index, b.index);
	});
	return array2.map(pack => pack.item);
}
function Compare(a, b, caseSensitive = true) {
	if (!caseSensitive && typeof a == 'string' && typeof b == 'string') {
		a = a.toLowerCase();
		b = b.toLowerCase();
	}
	return a < b ? -1 : (a > b ? 1 : 0);
}

/* function WithDeepSet(baseObj, pathOrPathSegments, newValue, sepChar = "/") {
	let pathSegments = pathOrPathSegments instanceof Array ? pathOrPathSegments : pathOrPathSegments.split(sepChar);
	return {
		...baseObj,
		[pathSegments[0]]: pathSegments.length > 1 ? WithDeepSet(baseObj[pathSegments[0]], pathSegments.slice(1), newValue) : newValue,
	};
} */

module.exports = webpackConfig;
