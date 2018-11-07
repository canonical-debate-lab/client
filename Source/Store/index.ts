import { DeepGet } from 'js-vextensions';
import { combineReducers } from 'redux';
import { OnAccessPath } from 'Utils/Database/FirebaseConnect';
import { SplitStringBySlash_Cached } from 'Utils/Database/StringSplitCache';

export class RootState {
}
export function MakeRootReducer(extraReducers?) {
	return combineReducers({
		// add reducers here
	});
}

export class State_Options {
	countAsAccess?: boolean;
}

// for substantially better perf, we now only accept string-or-number arrays
declare global {
	function State<T>(): RootState;
	function State<T>(pathGetterFunc: (state: RootState)=>T): T;
	function State<T>(...pathSegments: (string | number)[]);
	function State<T>(options: State_Options, ...pathSegments: (string | number)[]);
}
function State<T>(...args) {
	let state = store.getState();

	if (args.length == 0) return state;

	let pathSegments: (string | number)[], options = new State_Options();
	if (typeof args[0] == 'object') {
		[options, ...pathSegments] = args;
	} else {
		pathSegments = args;
	}

	if (typeof pathSegments[0] == 'function') {
		pathSegments = ConvertPathGetterFuncToPropChain(args[0]);
	} else { //if (typeof pathSegments[0] == 'string') {
		if (pathSegments.length == 1) pathSegments = SplitStringBySlash_Cached(pathSegments[0] as string); // if only one string provided, assume it's the full path
	}

	if (DEV) {
		Assert(pathSegments.every(segment=>segment != null), ()=>`Path-segment cannot be null. @segments(${pathSegments})`);
		Assert(pathSegments.every(segment=>typeof segment == 'number' || !segment.Contains('/')),
			()=>`Each string path-segment must be a plain prop-name. (ie. contain no '/' separators) @segments(${pathSegments})`);
	}

	let countAsAccess = options.countAsAccess != null ? options.countAsAccess : true;

	let selectedData = DeepGet(state, pathSegments);
	//if (countAsAccess && pathSegments.length) {
	if (countAsAccess) {
		let path = typeof pathSegments[0] == 'string' && pathSegments.length == 1 ? pathSegments[0] as string : pathSegments.join('/');
		//Assert(g.inConnectFunc, 'State(), with countAsAccess:true, must be called from within a Connect() func.');
		OnAccessPath(path);
	}
	return selectedData;
}
function ConvertPathGetterFuncToPropChain(pathGetterFunc: Function) {
	let pathStr = pathGetterFunc.toString().match(/return a\.(.+?);/)[1] as string;
	Assert(!pathStr.includes('['), `State-getter-func cannot contain bracket-based property-access.\n${nl
		}For variable inclusion, use multiple segments as in 'State('main', 'mapViews', mapID)'.`);
	//let result = pathStr.replace(/\./g, '/');
	let result = pathStr.split('.');
	return result;
}
export function StorePath(pathGetterFunc: (state: RootState)=>any) {
	return ConvertPathGetterFuncToPropChain(pathGetterFunc).join('/');
}