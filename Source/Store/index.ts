import {Assert, DeepGet, DeepSet} from "js-vextensions";
import {VMenuReducer, VMenuState} from "react-vmenu";
import {combineReducers} from "redux";
import {firebaseStateReducer, helpers} from "react-redux-firebase";
import {MessageBoxReducer, MessageBoxState} from "react-vmessagebox";
import {MainState, MainReducer} from "./main";
import {LocationDescriptorObject} from "history";
import { store } from "Main_Hot";
import { SplitStringBySlash_Cached } from "Utils/Database/StringSplitCache";
import { OnAccessPath } from "Utils/Database/FirebaseConnect";
import { Action, IsACTSetFor } from "Utils/Store/Action";

export class State_Options {
	countAsAccess?: boolean;
}

// for substantially better perf, we now only accept string-or-number arrays
export function State<T>(): RootState;
export function State<T>(pathGetterFunc: (state: RootState)=>T): T;
export function State<T>(...pathSegments: (string | number)[]);
export function State<T>(options: State_Options, ...pathSegments: (string | number)[]);
export function State<T>(...args) {
	let state = store.getState();

	if (args.length == 0) return state;

	let pathSegments: (string | number)[], options = new State_Options();
	if (typeof args[0] == "object") {
		[options, ...pathSegments] = args;
	} else {
		pathSegments = args;
	}

	if (typeof pathSegments[0] == "function") {
		pathSegments = ConvertPathGetterFuncToPropChain(args[0]);
	} else { //if (typeof pathSegments[0] == "string") {
		if (pathSegments.length == 1) pathSegments = SplitStringBySlash_Cached(pathSegments[0] as string); // if only one string provided, assume it's the full path
	}

	if (DEV) {
		Assert(pathSegments.every(segment=>segment != null), ()=>`Path-segment cannot be null. @segments(${pathSegments})`);
		Assert(pathSegments.every(segment=>typeof segment == "number" || !segment.Contains("/")),
			()=>`Each string path-segment must be a plain prop-name. (ie. contain no "/" separators) @segments(${pathSegments})`);
	}

	let countAsAccess = options.countAsAccess != null ? options.countAsAccess : true;

	let selectedData = DeepGet(state, pathSegments);
	//if (countAsAccess && pathSegments.length) {
	if (countAsAccess) {
		let path = typeof pathSegments[0] == "string" && pathSegments.length == 1 ? pathSegments[0] as string : pathSegments.join("/");
		//Assert(g.inConnectFunc, "State(), with countAsAccess:true, must be called from within a Connect() func.");
		OnAccessPath(path);
	}
	return selectedData;
}
function ConvertPathGetterFuncToPropChain(pathGetterFunc: Function) {
	let pathStr = pathGetterFunc.toString().match(/return a\.(.+?);/)[1] as string;
	Assert(!pathStr.includes("["), `State-getter-func cannot contain bracket-based property-access.\n${nl
		}For variable inclusion, use multiple segments as in "State("main", "mapViews", mapID)".`);
	//let result = pathStr.replace(/\./g, "/");
	let result = pathStr.split(".");
	return result;
}
export function StorePath(pathGetterFunc: (state: RootState)=>any) {
	return ConvertPathGetterFuncToPropChain(pathGetterFunc).join("/");
}

export function InjectReducer(store, {key, reducer}) {
	store.asyncReducers[key] = reducer;
	store.replaceReducer(MakeRootReducer(store.asyncReducers));
}

type ACTSet_Payload = {path: string | ((state: RootState)=>any), value};
export class ACTSet extends Action<ACTSet_Payload> {
	constructor(path: string | ((state: RootState)=>any), value) {
		if (typeof path == "function") path = StorePath(path);
		super({path, value});
		this.type = "ACTSet_" + path; //.replace(/[^a-zA-Z0-9]/g, "_"); // add path to action-type, for easier debugging in dev-tools
	}
}
export function SimpleReducer(path: string | ((store: RootState)=>any), defaultValue = null) {
	if (IsFunction(path)) path = StorePath(path);
	return (state = defaultValue, action: Action<any>)=> {
		if (IsACTSetFor(action, path as string)) return action.payload.value;
		return state;
	};
}

export class ApplyActionSet extends Action<Action<any>[]> {
	constructor(payload) {
		super(payload);
		Assert(payload.actions == null, `Your code should be "new ApplyActionSet(actions)", not "new ApplyActionSet({actions})".`)
		this.actions = payload; // copy to this.actions as well (shorter lines in CreateStore.ts)
	}
	actions: Action<any>;
}

let bufferedActions: Action<any>[];
export function StartBufferingActions() {
	bufferedActions = [];
}
export function StopBufferingActions() {
	let oldBufferedActions = bufferedActions;
	bufferedActions = null;
	store.dispatch(new ApplyActionSet(oldBufferedActions));
}

// class is used only for initialization
export class RootState {
	main: MainState;
	//firebase: FirebaseDatabase;
	firebase: any;
	router: RouterState;
	messageBox: MessageBoxState;
	vMenu: VMenuState;
}
export function MakeRootReducer(extraReducers?) {
	const innerReducer = combineReducers({
		main: MainReducer,
		firebase: firebaseStateReducer,
		messageBox: MessageBoxReducer,
		vMenu: VMenuReducer,
		...extraReducers
	});

	let rootReducer = (state: RootState, rootAction)=> {
		if (bufferedActions) {
			bufferedActions.push(rootAction);
			return state;
		}

		let actions = rootAction.type == "ApplyActionSet" ? rootAction.actions : [rootAction];

		let result = state;
		for (let action of actions) {
			if (action.type == "ApplyActionSet") {
				result = rootReducer(result, action);
				continue;
			}
			
			try {
				let oldResult = result;
				result = innerReducer(result, action) as RootState;
				//if (action.Is(ACTSet)) {
				/*if (action.type.startsWith("ACTSet_")) {
					result = u.updateIn(action.payload.path.replace(/\//g, "."), u.constant(action.payload.value), result);
				}*/

				if (action.type.startsWith("ACTSet_") && result == oldResult) {
					console.warn(`An ${action.type} action was dispatched, but did not cause any change to the store contents! Did you forget to add a reducer entry?`);
				}
			} catch (ex) {
				console.error(ex, action);
			}
		}

		return result;
	};

	return rootReducer;
}

interface RouterState {
	location: LocationDescriptorObject & {hash: string}; // typing must be outdated, as lacks hash prop
	history: any;
}