import { DeepGet } from 'js-vextensions';
import { RootState } from 'Store';
import { State_overrides, State_Options } from 'UI/@Shared/StateOverrides';
import { SplitStringBySlash_Cached } from 'Frame/Database/StringSplitCache';
import { OnAccessPath } from '../Database/FirebaseConnect';
import { Action, IsACTSetFor } from '../General/Action';
// import {reducer as formReducer} from "redux-form";

/* declare global {
	function State<T>(pathSegment: ((state: RootState)=>T) | string | number, state?: RootState, countAsAccess?: boolean): T;
	function State<T>(pathSegments: (((state: RootState)=>T) | string | number)[], state?: RootState, countAsAccess?: boolean): any;
}
//function State<T>(pathSegmentOrSegments, state = State_extras.overrideState || store.getState(), countAsAccess = true) {
function State<T>(pathOrPathSegments, state?: RootState, countAsAccess?: boolean) {
	state = state || State_overrides.state || store.getState();
	countAsAccess = countAsAccess != null ? countAsAccess : (State_overrides.countAsAccess != null ? State_overrides.countAsAccess : true);
	if (pathOrPathSegments == null) return state;

	let propChain: string[];
	if (typeof pathOrPathSegments == "string") {
		propChain = pathOrPathSegments.split("/");
	} else if (typeof pathOrPathSegments == "function") {
		propChain = ConvertPathGetterFuncToPropChain(pathOrPathSegments);
	} else {
		if (pathOrPathSegments.length == 0) return state;

		propChain = pathOrPathSegments.SelectMany(segment=> {
			if (segment instanceof Function) {
				return ConvertPathGetterFuncToPropChain(segment);
			}
			Assert(typeof segment == "number" || !segment.Contains("/"),
				`Each string path-segment must be a plain prop-name. (ie. contain no "/" separators) @segment(${segment})`);
			return [segment];
		});
	}

	let selectedData = DeepGet(state, propChain);
	if (countAsAccess) {
		let path = propChain.join("/");
		//Assert(g.inConnectFunc, "State(), with countAsAccess:true, must be called from within a Connect() func.");
		OnAccessPath(path);
	}
	return selectedData;
} */

// for substantially better perf, we now only accept string-or-number arrays
/* declare global {
	function State<T>(): RootState;
	function State<T>(pathGetterFunc: (state: RootState)=>T): T;
	function State<T>(...pathSegments: (string | number)[]);
	function State<T>(options: State_Options, ...pathSegments: (string | number)[]);
} */

export function State<T>(): RootState;
export function State<T>(pathGetterFunc: (state: RootState)=>T): T;
export function State<T>(...pathSegments: (string | number)[]);
export function State<T>(options: State_Options, ...pathSegments: (string | number)[]);
export function State<T>(...args) {
	let pathSegments: (string | number)[];
	let options = new State_Options();
	if (args.length === 0) return State_overrides.state || store.getState();
	if (typeof args[0] === 'function') pathSegments = ConvertPathGetterFuncToPropChain(args[0]);
	else if (typeof args[0] === 'string') pathSegments = args;
	else [options, ...pathSegments] = args;

	// if only one string provided, assume it's the full path
	if (pathSegments.length === 1) {
		pathSegments = SplitStringBySlash_Cached(pathSegments[0] as string);
	}

	if (DEV) {
		Assert(pathSegments.All(segment => segment != null), `Path-segment cannot be null. @segments(${pathSegments})`);
		Assert(pathSegments.All(segment => typeof segment === 'number' || !segment.Contains('/')),
			`Each string path-segment must be a plain prop-name. (ie. contain no "/" separators) @segments(${pathSegments})`);
	}

	options.state = options.state || State_overrides.state || store.getState();
	options.countAsAccess = options.countAsAccess != null ? options.countAsAccess : (State_overrides.countAsAccess != null ? State_overrides.countAsAccess : true);

	const selectedData = DeepGet(options.state, pathSegments);
	// if (options.countAsAccess && pathSegments.length) {
	if (options.countAsAccess) {
		const path = typeof args[0] === 'string' && args.length === 1 ? args[0] : pathSegments.join('/');
		// Assert(g.inConnectFunc, "State(), with countAsAccess:true, must be called from within a Connect() func.");
		OnAccessPath(path);
	}
	return selectedData;
}

function ConvertPathGetterFuncToPropChain(pathGetterFunc: Function) {
	const pathStr = pathGetterFunc.toString().match(/return a\.(.+?);/)[1] as string;
	Assert(!pathStr.includes('['), `State-getter-func cannot contain bracket-based property-access.\n${nl
	}For variable inclusion, use multiple segments as in "State("main", "mapViews", mapID)".`);
	// let result = pathStr.replace(/\./g, "/");
	const result = pathStr.split('.');
	return result;
}
export function StorePath(pathGetterFunc: (state: RootState)=>any) {
	return ConvertPathGetterFuncToPropChain(pathGetterFunc).join('/');
}

/* export function InjectReducer(store, {key, reducer}) {
	store.asyncReducers[key] = reducer;
	store.replaceReducer(MakeRootReducer(store.asyncReducers));
} */

type ACTSet_Payload = {path: string | ((state: RootState)=>any), value};
export class ACTSet extends Action<ACTSet_Payload> {
	constructor(path: string | ((state: RootState)=>any), value) {
		if (typeof path === 'function') path = StorePath(path);
		super({ path, value });
		this.type = `ACTSet_${path}`; // .replace(/[^a-zA-Z0-9]/g, "_"); // add path to action-type, for easier debugging in dev-tools
	}
	type: string;
}
export function SimpleReducer(path: string | ((store: RootState)=>any), defaultValue = null) {
	if (IsFunction(path)) path = StorePath(path);
	return (state = defaultValue, action: Action<any>) => {
		if (IsACTSetFor(action, path as string)) return action.payload.value;
		return state;
	};
}

export class ActionSet extends Action<{actions: Action<any>[]}> {
	constructor(...actions: Action<any>[]) {
		Assert(actions.find(action => action instanceof Array) == null, 'Your code should be "new ActionSet(action1, action2, ...)", not "new ActionSet(actions)".');
		Assert(actions.find(action => action.type === 'ActionSet') == null, 'An ActionSet cannot contain an ActionSet as a subaction. (unfold the subactions manually)');
		// this.actions = payload; // copy to this.actions as well (shorter lines in CreateStore.ts)
		super({ actions });
	}
	actions: Action<any>[];
}

export let bufferedActions: Action<any>[];
export function StartBufferingActions() {
	bufferedActions = [];
}
export function StopBufferingActions() {
	const oldBufferedActions = bufferedActions;
	bufferedActions = null;
	store.dispatch(new ActionSet(...oldBufferedActions));
}

/* export let uiConnectRefreshCalls: ((targetThis, rootState, props)=>any)[];
export function StartBufferingUIConnectRefreshes() {
	uiConnectRefreshCalls = [];
}
export function StopBufferingUIConnectRefreshes() {
	const oldUIConnectRefreshCalls = uiConnectRefreshCalls;
	uiConnectRefreshCalls = null;
	for (let refreshCall of oldUIConnectRefreshCalls) {
		// todo
	}
} */
