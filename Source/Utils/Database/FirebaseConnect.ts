import { GetPropsChanged, GetPropsChanged_WithValues } from "js-vextensions";
import Moment from "moment";
import { connect } from "react-redux";
import { ShallowChanged } from "react-vextensions";
import { ApplyActionSet, RootState } from "../../Store/index";
import {watchEvents} from "react-redux-firebase/lib/actions/query";
import {getEventsFromInput} from "react-redux-firebase/lib/utils";
import { activeStoreAccessCollectors } from "./DatabaseHelpers";

// Place a selector in Connect() whenever it uses data that:
// 1) might change during the component's lifetime, and:
// 2) is not already used by an existing selector in Connect()
// This way, it'll correctly trigger a re-render when the underlying data changes.

G({FirebaseConnect: Connect}); // make global, for firebase-forum
// if you're sending in a connect-func rather than a connect-func-wrapper, then you need to make it have at least one argument (to mark it as such)
export function Connect<T, P>(innerMapStateToPropsFunc: (state: RootState, props: P)=>any);
export function Connect<T, P>(mapStateToProps_inner_getter: ()=>(state: RootState, props: P)=>any);
export function Connect<T, P>(funcOrFuncGetter) {
	let mapStateToProps_inner: (state: RootState, props: P)=>any, mapStateToProps_inner_getter: ()=>(state: RootState, props: P)=>any;
	let isFuncGetter = funcOrFuncGetter.length == 0; //&& typeof TryCall(funcOrFuncGetter) == "function";
	if (!isFuncGetter) mapStateToProps_inner = funcOrFuncGetter;
	else mapStateToProps_inner_getter = funcOrFuncGetter;

	let mapStateToProps_wrapper = function(state: RootState, props: P) {
		let s = this;
		g.inConnectFunc = true;

		ClearRequestedPaths();
		ClearAccessedPaths();
		let firebase = store.firebase;

		let changedPath = null;
		let storeDataChanged = false;
		if (s.lastAccessedStorePaths_withData == null) {
			storeDataChanged = true;
		} else {
			for (let path in s.lastAccessedStorePaths_withData) {
				if (State({countAsAccess: false}, path) !== s.lastAccessedStorePaths_withData[path]) {
					//store.dispatch({type: "Data changed!" + path});
					storeDataChanged = true;
					changedPath = path;
					if (changedPath.includes("bot_currentNodeID")) debugger;
					break;
				}
			}
		}

		let changedProps = GetPropsChanged(s.lastProps, props, false);

		if (!storeDataChanged && changedProps.length == 0) {
			g.inConnectFunc = false;
			return s.lastResult;
		}

		var result = mapStateToProps_inner.call(s, state, props);

		// also access some other paths here, so that when they change, they trigger ui updates for everything
		result._user = GetUser(GetUserID());
		result._permissions = GetUserPermissionGroups(GetUserID());
		result._extraInfo = s.extraInfo;

		let oldRequestedPaths: string[] = s.lastRequestedPaths || [];
		let requestedPaths: string[] = GetRequestedPaths();
		//if (firebase._ && ShallowChanged(requestedPaths, oldRequestedPaths)) {
		if (ShallowChanged(requestedPaths, oldRequestedPaths)) {
			setTimeout(()=> {
				s._firebaseEvents = getEventsFromInput(requestedPaths);
				let removedPaths = oldRequestedPaths.Except(...requestedPaths);
				// todo: find correct way of unwatching events; the way below seems to sometimes unwatch while still needed watched
				// for now, we just never unwatch
				//unWatchEvents(firebase, DispatchDBAction, getEventsFromInput(removedPaths));
				let addedPaths = requestedPaths.Except(...oldRequestedPaths);
				watchEvents(firebase, DispatchDBAction, getEventsFromInput(addedPaths));
				// for debugging, you can check currently-watched-paths using: store.firebase._.watchers
			});
			s.lastRequestedPaths = requestedPaths;
		}

		let accessedStorePaths: string[] = GetAccessedPaths();
		//ClearAccessedPaths();
		s.lastAccessedStorePaths_withData = {};
		for (let path of accessedStorePaths) {
			s.lastAccessedStorePaths_withData[path] = State({countAsAccess: false}, path);
		}
		s.lastProps = props;
		s.lastResult = result;

		g.inConnectFunc = false;

		return result;
	};

	if (mapStateToProps_inner) {
		return connect(mapStateToProps_wrapper, null, null, {withRef: true}); // {withRef: true} lets you do wrapperComp.getWrappedInstance() 
	}
	return connect(()=> {
		mapStateToProps_inner = mapStateToProps_inner_getter();
		return mapStateToProps_wrapper;
	}, null, null, {withRef: true});
}

let actionTypeBufferInfos = {
	"@@reactReduxFirebase/START": {time: 300},
	"@@reactReduxFirebase/SET": {time: 300},
};
let actionTypeLastDispatchTimes = {};
let actionTypeBufferedActions = {};

function DispatchDBAction(action) {
	let timeSinceLastDispatch = Date.now() - (actionTypeLastDispatchTimes[action.type] || 0);
	let bufferInfo = actionTypeBufferInfos[action.type];

	// if we're not supposed to buffer this action type, or it's been long enough since last dispatch of this type
	if (bufferInfo == null || timeSinceLastDispatch >= bufferInfo.time) {
		// dispatch action right away
		store.dispatch(action);
		actionTypeLastDispatchTimes[action.type] = Date.now();
	}
	// else, buffer action to be dispatched later
	else {
		// if timer not started, start it now
		if (actionTypeBufferedActions[action.type] == null) {
			setTimeout(()=> {
				// now that wait is over, apply any buffered event-triggers
				store.dispatch(new ApplyActionSet(actionTypeBufferedActions[action.type]));

				actionTypeLastDispatchTimes[action.type] = Date.now();
				actionTypeBufferedActions[action.type] = null;
			}, (actionTypeLastDispatchTimes[action.type] + bufferInfo.time) - Date.now());
		}

		// add action to buffer, to be run when timer ends
		actionTypeBufferedActions[action.type] = (actionTypeBufferedActions[action.type] || []).concat(action);
	}
}

let requestedPaths = {} as {[key: string]: boolean};
/** This only adds paths to a "request list". Connect() is in charge of making the actual db requests. */
export function RequestPath(path: string) {
	//MaybeLog(a=>a.dbRequests, ()=>"Requesting db-path (stage 1): " + path);
	requestedPaths[path] = true;
}
/** This only adds paths to a "request list". Connect() is in charge of making the actual db requests. */
export function RequestPaths(paths: string[]) {
	for (let path of paths) {
		RequestPath(path);
	}
}
export function ClearRequestedPaths() {
	requestedPaths = {};
}
export function GetRequestedPaths() {
	return requestedPaths.VKeys();
}

let accessedStorePaths = {} as {[key: string]: boolean};
export function OnAccessPath(path: string) {
	//Log("Accessing-path Stage1: " + path);
	//let path = pathSegments.join("/");
	accessedStorePaths[path] = true;
	if (activeStoreAccessCollectors) {
		for (let collector of activeStoreAccessCollectors) {
			collector.storePathsRequested.push(path);
		}
	}
}
/*export function OnAccessPaths(paths: string[]) {
	for (let path of paths)
		OnAccessPath(path);
}*/
export function ClearAccessedPaths() {
	accessedStorePaths = {};
}
export function GetAccessedPaths() {
	//Log("GetAccessedPaths:" + accessedStorePaths.VKeys());
	return accessedStorePaths.VKeys();
}