import { Options, Rule } from 'webpack-string-replacer';

export const npmPatch_replacerConfig: Options = {
	shouldValidate: ({ compilations }) => compilations.length == 3, // only validate on initial compile
	// validationLogType: 'logError',
	rules: [],
};

function AddRule(rule: Rule) {
	npmPatch_replacerConfig.rules.push(rule);
}

AddRule({
	fileInclude: /\.jsx?$/,
	replacements: [
		// optimization; replace `State(a=>a.some.thing)` with `State("some", "thing")`
		// (faster for the State function to consume, and supplies primitives instead of a function, meaning State.Watch(...) does not view the call-args as changed each render)
		{
			pattern: /(State|State_Base)\(a ?=> ?a\.([a-zA-Z0-9_.]+)\)/g,
			replacement(match, sub1, sub2: string, offset, string) {
				const pathStr = sub2.replace(/\./g, '/');
				// return `${sub1}("${pathStr}")`;
				const pathSegments = pathStr.split('/');
				return `${sub1}("${pathSegments.join('", "')}")`;
			},
		},
		// make function-names of store-accessors accessible to watcher debug-info, for react-devtools
		{
			pattern: /export const ([a-zA-Z0-9_$]+?) = StoreAccessor\(\(/g,
			replacement(match, sub1, offset, string) {
				return `export const ${sub1} = StoreAccessor("${sub1}", (`;
			},
		},
		// make function-names of store-actions accessible at runtime
		{
			pattern: /export const ([a-zA-Z0-9_$]+?) = StoreAction\(\(/g,
			replacement(match, sub1, offset, string) {
				return `export const ${sub1} = StoreAction("${sub1}", (`;
			},
		},
		/* {
			pattern: /State\(function \(a\) {\s+return a.([a-zA-Z0-9_.]+);\s+}\)/g,
			replacement: function(match, sub1, offset, string) {
				Log("Replacing...");
				return `State("${sub1.replace(/\./g, "/")}")`;
			}
		}, */
	],
});

// AddStringReplacement(/connected-(draggable|droppable).js$/, [
AddRule({
	fileInclude: /react-beautiful-dnd.esm.js$/,
	// logFileMatches: true,
	fileMatchCount: 1,
	replacements: [
		// note: the replacements below may need updating, since the library was updated since the replacements were written
		// make react-beautiful-dnd import react-redux using a relative path, so it uses its local v5 instead of the project's v6
		/* {
			pattern: /from 'react-redux';/g,
			replacement: (match, offset, str) => "from '../node_modules/react-redux';",
		}, */
		// make lib support nested-lists better (from: https://github.com/atlassian/react-beautiful-dnd/pull/636)
		{
			pattern: /var getDroppableOver\$1 = (.|\n)+?(?=var withDroppableScroll)/,
			patternMatchCount: 1,
			// logAroundPatternMatches: 100,
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
			pattern: /var canScrollDroppable = function canScrollDroppable.+/g,
			patternMatchCount: 1,
			replacement: () => `
				var canScrollDroppable = function canScrollDroppable(droppable, change) {
					if (window.LockMapEdgeScrolling()) return false;
			`.trim(),
		},
	],
});

// react
/* AddStringReplacement(/ReactDebugTool.js/, [
	{
		// expose ReactDebugTool.getTreeSnapshot
		pattern: /module.exports = /g,
		replacement: (match, offset, string) => Clip(`
ReactDebugTool.getTreeSnapshot = getTreeSnapshot;

module.exports =
			`),
	},
]); */

// make all Object.defineProperty calls leave the property configurable (probably better to just wrap the Object.defineProperty function)
/* AddStringReplacement(/index\.js$/, [
	{
		pattern: /enumerable: true,/g,
		replacement(match, offset, string) {
			return `${match} configurable: true,`;
		},
	},
]); */

// firebase-mock
/* AddStringReplacement(/firebase-mock\/src\/storage-file.js/, [
	{
		// remove "fs" require
		pattern: /require\('fs'\)/g,
		replacement: (match, offset, string) => {
			console.log('=== Replaced fs line. ===');
			return '{}';
		},
	},
]); */

// immer
AddRule({
	fileInclude: /immer.module.js$/,
	// logFileMatches: true,
	// logFileMatchContents: true,
	// fileMatchCount: 2, // one for root/immer, another for vwebapp-framework/immer (make sure to run "npm link vwebapp-framework")
	fileMatchCount: 1,
	replacements: [
		// makes-so immer accept any object in its "produce" function (so we don't need to add the "[immerable] = true" markers)
		/* {
			pattern: 'function isDraftable(value) {',
			patternMatchCount: 1,
			replacement: 'function isDraftable(value) { return true;',
		}, */
		// makes-so when traversing down path with getter-setters, immer proceeds instead of halting
		{
			pattern: 'function shallowCopy(base, invokeGetters) {',
			patternMatchCount: 1,
			// logAroundPatternMatches: 100,
			replacement: 'function shallowCopy(base, invokeGetters) { invokeGetters = true;',
		},
		/* {
			pattern: /var assign = (.|\n)+?(?=var ownKeys)/,
			patternMatchCount: 2,
			replacement: `
var assign = (function (target) {
	var overrides = [], len = arguments.length - 1;
	while ( len-- > 0 ) overrides[ len ] = arguments[ len + 1 ];

	overrides.forEach(function (override) {
		return Object.keys(override || {}).forEach(function (key) {
			/*delete target[key]; // v-added
			return target[key] = override[key];*#/
			Object.defineProperty(target, key, {value: override[key]});
		});
	});
	return target;
});
 			`.trim(),
		}, */
		// the 3 changes below make-so, when immer is trying to set a field under a path with getter-setters along it, it replaces those getter-setters with just the value itself (on the copy/result object, not the draft/proxy or source object)
		{
			pattern: 'if (isMap(base)) { assignMap(copy, drafts); }else { assign(copy, drafts); }',
			patternMatchCount: 1,
			replacement: `
				if (isMap(base)) {
					assignMap(copy, drafts);
				} else {
					Object.keys(drafts).forEach(function (key) {
						Object.defineProperty(copy, key, {configurable: true, writable: true, value: drafts[key]});
					});
				}
			`,
		},
		{
			pattern: 'return state.copy[prop] = createProxy(value, state);',
			patternMatchCount: 1,
			replacement: 'Object.defineProperty(state.copy, prop, {configurable: true, writable: true, value: createProxy(value, state)}); return state.copy;',
		},
		{
			pattern: 'state.copy[prop] = value;',
			patternMatchCount: 2,
			replacement: 'Object.defineProperty(state.copy, prop, {configurable: true, writable: true, value: value});',
		},
	],
});