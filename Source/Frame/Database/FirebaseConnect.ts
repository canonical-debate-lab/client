import { activeStoreAccessCollectors, PathToListenerPath, GetPathParts, NotifyPathsReceiving, NotifyPathsReceived } from 'Frame/Database/DatabaseHelpers';
import { GetPropsChanged, GetPropsChanged_WithValues, DeepGet } from 'js-vextensions';
import _ from 'lodash';
import Moment from 'moment';
import { connect } from 'react-redux';
import { getEventsFromInput } from 'react-redux-firebase/lib/utils';
import { ShallowChanged } from 'react-vextensions';
import { GetUserID } from 'Store/firebase/users';
import { setListeners, unsetListeners } from 'redux-firestore/es/actions/firestore';
import firebase from 'firebase';
import { GetUser, GetUserPermissions } from '../../Store/firebase/users';
import { ApplyActionSet, RootState } from '../../Store/index';
import { DoesActionSetFirestoreData, GetFirestoreDataSetterActionPath } from 'Store/firebase';
import { firestoreReducer } from 'redux-firestore';
import { AddDispatchInterceptor } from 'Frame/Store/CreateStore';

// Place a selector in Connect() whenever it uses data that:
// 1) might change during the component's lifetime, and:
// 2) is not already used by an existing selector in Connect()
// This way, it'll correctly trigger a re-render when the underlying data changes.

/* export function Connect<T, P>(getterFunc: (state: RootState, props: P)=>any) {
	return (innerClass: new(...args)=>T) => {
		class FirebaseConnect extends Component {
			// [...]
			render () {
				return (
					<innerClass
						{...this.props}
						{...this.state}
						firebase={this.firebase}
					/>
				)
			}
		}
		return FirebaseConnect;
	}
} */

G({ FirebaseConnect: Connect }); // make global, for firebase-forum
// if you're sending in a connect-func rather than a connect-func-wrapper, then you need to make it have at least one argument (to mark it as such)
export function Connect<T, P>(innerMapStateToPropsFunc: (state: RootState, props: P)=>any);
export function Connect<T, P>(mapStateToProps_inner_getter: ()=>(state: RootState, props: P)=>any);
export function Connect<T, P>(funcOrFuncGetter) {
	let mapStateToProps_inner: (state: RootState, props: P)=>any;
	let mapStateToProps_inner_getter: ()=>(state: RootState, props: P)=>any;
	const isFuncGetter = funcOrFuncGetter.length == 0; // && typeof TryCall(funcOrFuncGetter) == "function";
	if (!isFuncGetter) mapStateToProps_inner = funcOrFuncGetter;
	else mapStateToProps_inner_getter = funcOrFuncGetter;

	function mapStateToProps_wrapper(state: RootState, props: P) {
		const s = this;
		g.inConnectFuncFor = s.WrappedComponent;

		// if (ShouldLog(a=>a.check_callStackDepths)) {
		/* if (DEV) {
			let callStackDepth = GetStackTraceStr().split("\n").length;
			// if we're at a call-stack-depth of X, we know something's wrong, so break
			Assert(callStackDepth < 1000, `Call-stack-depth too deep (${callStackDepth})! Something must be wrong with the UI code.`);
		} */

		ClearRequestedPaths();
		ClearAccessedPaths();
		// Assert(GetAccessedPaths().length == 0, "Accessed-path must be empty at start of mapStateToProps call (ie. the code in Connect()).");
		const { firestore } = store;

		let changedPath = null;
		let storeDataChanged = false;
		if (s.lastAccessedStorePaths_withData == null) {
			storeDataChanged = true;
		} else {
			for (const path in s.lastAccessedStorePaths_withData) {
				if (State({ countAsAccess: false }, path) !== s.lastAccessedStorePaths_withData[path]) {
					// store.dispatch({type: "Data changed!" + path});
					storeDataChanged = true;
					changedPath = path;
					break;
				}
			}
		}

		// let propsChanged = ShallowChanged(props, s.lastProps || {});
		// let propsChanged = ShallowChanged(props, s.lastProps || {}, "children");
		const changedProps = GetPropsChanged(s.lastProps, props, false);

		// let result = storeDataChanged ? mapStateToProps_inner(state, props) : s.lastResult;
		if (!storeDataChanged && changedProps.length == 0) {
			g.inConnectFuncFor = null;
			return s.lastResult;
		}

		if (logTypes.renderTriggers) {
			s.extraInfo = s.extraInfo || {};
			const CreateRenderTriggerArray = () => [].VAct(a => Object.defineProperty(a, '$Clear', { get: () => s.extraInfo.recentRenderTriggers = CreateRenderTriggerArray() }));
			const recentRenderTriggers = s.extraInfo.recentRenderTriggers as any[] || CreateRenderTriggerArray();
			const renderTrigger = {
				propChanges: GetPropsChanged_WithValues(s.lastProps, props),
				storeChanges: GetPropsChanged_WithValues(s.lastAccessedStorePaths_withData, (s.lastAccessedStorePaths_withData || {}).VKeys().ToMap(key => key, key => State(key))),
				time: Moment().format('HH:mm:ss'),
			};
			// add new entries to start, and trim old ones from end
			recentRenderTriggers.splice(0, 0, renderTrigger);
			if (recentRenderTriggers.length > 100) {
				recentRenderTriggers.splice(-1, 1);
			}
			s.extraInfo.recentRenderTriggers = recentRenderTriggers;
		}

		// for debugging in profiler
		/* if (DEV) {
			//let debugText = ToJSON(props).replace(/[^a-zA-Z0-9]/g, "_");
			let debugText = `${props["node"] ? " @ID:" + props["node"]._id : ""} @changedPath: ${changedPath} @changedProps: ${changedProps.join(", ")}`;
			let wrapperFunc = eval(`(function ${debugText.replace(/[^a-zA-Z0-9]/g, "_")}() { return mapStateToProps_inner.apply(s, arguments); })`);
			var result = wrapperFunc.call(s, state, props);
		} else */ {
			var result = mapStateToProps_inner.call(s, state, props);
		}

		// also access some other paths here, so that when they change, they trigger ui updates for everything
		result._user = GetUser(GetUserID());
		result._permissions = GetUserPermissions(GetUserID());
		result._extraInfo = s.extraInfo;

		const oldRequestedPaths: string[] = s.lastRequestedPaths || [];
		const requestedPaths: string[] = GetRequestedPaths();
		// if (firebase._ && ShallowChanged(requestedPaths, oldRequestedPaths)) {
		if (ShallowChanged(requestedPaths, oldRequestedPaths)) {
			setImmediate(() => {
				// s.lastEvents = getEventsFromInput(requestedPaths.map(path=>GetPathParts(path)[0]));
				const removedPaths = oldRequestedPaths.Except(...requestedPaths);
				// todo: find correct way of unwatching events; the way below seems to sometimes unwatch while still needed watched
				// for now, we just never unwatch
				// unWatchEvents(store.firebase, DispatchDBAction, getEventsFromInput(removedPaths));
				// store.firestore.unsetListeners(removedPaths.map(path=>GetPathParts(path)[0]));
				/* const removedPaths_toDocs = removedPaths.map(path => GetPathParts(path)[0]);
				const removedPaths_toDocs_asListenerPaths = removedPaths_toDocs.map(path => PathToListenerPath(path));
				// store.firestore.unsetListeners(removedPaths_toDocs_asListenerPaths);
				unsetListeners(firebase['firebase_'] || firebase, DispatchDBAction, removedPaths_toDocs_asListenerPaths); */
				// UnsetListeners(removedPaths);

				const addedPaths = requestedPaths.Except(...oldRequestedPaths);
				/* const addedPaths_toDocs = addedPaths.map(path => GetPathParts(path)[0]);
				const addedPaths_toDocs_asListenerPaths = addedPaths_toDocs.map(path => PathToListenerPath(path));
				// watchEvents(store.firebase, DispatchDBAction, getEventsFromInput(addedPaths.map(path=>GetPathParts(path)[0])));
				// for debugging, you can check currently-watched-paths using: store.firestore._.listeners
				// store.firestore.setListeners(addedPaths_toDocs_asListenerPaths);
				setListeners(firebase['firebase_'] || firebase, DispatchDBAction, addedPaths_toDocs_asListenerPaths); */
				SetListeners(addedPaths);
			});
			s.lastRequestedPaths = requestedPaths;
		}

		const accessedStorePaths: string[] = GetAccessedPaths();
		// ClearAccessedPaths();
		s.lastAccessedStorePaths_withData = {};
		for (const path of accessedStorePaths) {
			s.lastAccessedStorePaths_withData[path] = State({ countAsAccess: false }, path);
		}
		s.lastProps = props;
		s.lastResult = result;

		g.inConnectFuncFor = null;

		return result;
	}

	if (mapStateToProps_inner) {
		return connect(mapStateToProps_wrapper, null, null, { withRef: true }); // {withRef: true} lets you do wrapperComp.getWrappedInstance()
	}
	return connect(() => {
		mapStateToProps_inner = mapStateToProps_inner_getter();
		return mapStateToProps_wrapper;
	}, null, null, { withRef: true });
}

export const pathListenerCounts = {};
export function SetListeners(paths: string[]) {
	const paths_toDocs = paths.map(path => GetPathParts(path)[0]);
	for (const path of paths_toDocs) {
		const oldListenerCount = pathListenerCounts[path] || 0;
		pathListenerCounts[path] = oldListenerCount + 1;
		if (oldListenerCount > 0) continue;

		// for debugging, you can check currently-watched-paths using: store.firestore._.listeners
		const listenerPath = PathToListenerPath(path);
		store.firestore.setListener(listenerPath);
	}
}
export function UnsetListeners(paths: string[], forceUnsetActualListener = false) {
	const paths_toDocs = paths.map(path => GetPathParts(path)[0]);
	for (const path of paths_toDocs) {
		const listenerPath = PathToListenerPath(path);
		pathListenerCounts[path]--;
		if (pathListenerCounts[path] == 0 || forceUnsetActualListener) {
			store.firestore.unsetListener(listenerPath);
		}
	}
}

// in dev-mode, don't buffer actinos as this makes it harder to debug using Redux dev-tools panel
const actionTypeBufferInfos = DEV ? {} : {
	'@@reactReduxFirebase/START': { time: 300 },
	'@@reactReduxFirebase/SET': { time: 300 },
	// buffer these less, since is we buffer too much it can slow down the progressive-response of the Connect() functions to new data
	/* '@@reactReduxFirebase/SET_LISTENER': { time: 100 },
	'@@reactReduxFirebase/LISTENER_RESPONSE': { time: 100 },
	'@@reactReduxFirebase/UNSET_LISTENER': { time: 100 }, */
};
const actionTypeLastDispatchTimes = {};
const actionTypeBufferedActions = {};

AddDispatchInterceptor((action) => {
	const timeSinceLastDispatch = Date.now() - (actionTypeLastDispatchTimes[action.type] || 0);
	const bufferInfo = actionTypeBufferInfos[action.type];

	// These are merely informational entries into the redux store. We don't use them, so block these actions from being dispatched.
	// if (action.type === '@@reduxFirestore/SET_LISTENER' || action.type === '@@reduxFirestore/UNSET_LISTENER') return;
	if (action.type === '@@reduxFirestore/SET_LISTENER' || action.type === '@@reduxFirestore/UNSET_LISTENER' || DoesActionSetFirestoreData(action)) {
		// let path = GetFirestoreDataSetterActionPath(action);
		const state = State();
		// const newFirebaseState = firebaseStateReducer(state.firebase, action);
		const newFirestoreState = firestoreReducer(state.firestore, action);

		// Watch for changes to requesting and requested, and channel those statuses into a custom pathReceiveStatuses map.
		// This way, when an action only changes these statuses, we can cancel the action dispatch, greatly reducing performance impact.
		NotifyPathsReceiving(newFirestoreState.status.requesting.Pairs().filter(a => a.value).map(a => a.key));
		NotifyPathsReceived(newFirestoreState.status.requested.Pairs().filter(a => a.value).map(a => a.key));

		// Here we check if the action changed more than just the statuses. If it didn't, then the action dispatch is canceled. (basically -- the action applies no state change, leading to store subscribers not being notified)
		/* const oldData = DeepGet(state.firestore.data, path);
		const newData = DeepGet(newFirestoreState.data, path);
		// if (newData === oldData) {
		if (newData === oldData || ToJSON(newData) === ToJSON(oldData)) {
			return false;
		} */
		if (action.type === '@@reduxFirestore/SET_LISTENER' || action.type === '@@reduxFirestore/UNSET_LISTENER') {
			return false; // block dispatch
		}
	}

	// if we're not supposed to buffer this action type, or it's been long enough since last dispatch of this type
	if (bufferInfo == null || timeSinceLastDispatch >= bufferInfo.time) {
		actionTypeLastDispatchTimes[action.type] = Date.now();
		// dispatch action right away
		return true;
	}

	// else, buffer action to be dispatched later
	// if timer not started, start it now
	if (actionTypeBufferedActions[action.type] == null) {
		setTimeout(() => {
			// now that wait is over, apply any buffered event-triggers
			store.dispatch(new ApplyActionSet(actionTypeBufferedActions[action.type]));

			actionTypeLastDispatchTimes[action.type] = Date.now();
			actionTypeBufferedActions[action.type] = null;
		}, (actionTypeLastDispatchTimes[action.type] + bufferInfo.time) - Date.now());
	}

	// add action to buffer, to be run when timer ends
	actionTypeBufferedActions[action.type] = (actionTypeBufferedActions[action.type] || []).concat(action);
});

let requestedPaths = {} as {[key: string]: boolean};
/** This only adds paths to a "request list". Connect() is in charge of making the actual db requests. */
export function RequestPath(path: string) {
	MaybeLog(a => a.dbRequests, () => `${_.padEnd(`Requesting db-path (stage 1): ${path}`, 150)}Component:${g.inConnectFuncFor ? g.inConnectFuncFor.name : ''}`);
	// firestore path-requests are always by-doc, so cut off any field-paths
	const path_toDoc = GetPathParts(path)[0];
	requestedPaths[path_toDoc] = true;
}
/** This only adds paths to a "request list". Connect() is in charge of making the actual db requests. */
export function RequestPaths(paths: string[]) {
	for (const path of paths) {
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
	// Log("Accessing-path Stage1: " + path);
	// let path = pathSegments.join("/");
	accessedStorePaths[path] = true;
	if (activeStoreAccessCollectors) {
		for (const collector of activeStoreAccessCollectors) {
			collector.storePathsRequested.push(path);
		}
	}
}
/* export function OnAccessPaths(paths: string[]) {
	for (let path of paths)
		OnAccessPath(path);
} */
export function ClearAccessedPaths() {
	accessedStorePaths = {};
}
export function GetAccessedPaths() {
	// Log("GetAccessedPaths:" + accessedStorePaths.VKeys());
	return accessedStorePaths.VKeys();
}
