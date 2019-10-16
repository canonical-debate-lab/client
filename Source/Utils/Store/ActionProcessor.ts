import { SleepAsync, Vector2i, VURL, ToJSON, Clone } from 'js-vextensions';
import { hasHotReloaded } from 'Main';
import Raven from 'raven-js';
import ReactGA from 'react-ga';
import { FindReact, GetDOM } from 'react-vextensions';
import { GetAuth, IsAuthValid } from 'Store/firebase';
import { GetNodeChildrenL2, GetNodeID } from 'Store/firebase/nodes';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { ACTMapViewMerge } from 'Store/main/mapViews/$mapView';
import { Action, ActionSet, DBPath, GetAsync, GetCurrentURL, GetDataAsync, LoadURL, MaybeLog, State } from 'Utils/FrameworkOverrides';
import { GetCurrentURL_SimplifiedForPageViewTracking } from 'Utils/URL/URLs';
import { GetOpenMapID } from 'Store/main';
import { Map } from '../../Store/firebase/maps/@Map';
import { RootState } from '../../Store/index';
import { ACTDebateMapSelect, ACTDebateMapSelect_WithData } from '../../Store/main/debates';
import { ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineCurrentStepRevealNodes } from '../../Store/main/maps/$map';
import { GetNodeView, GetMapView } from '../../Store/main/mapViews';
import { ACTMapNodeExpandedSet } from '../../Store/main/mapViews/$mapView/rootNodeViews';
import { ACTPersonalMapSelect, ACTPersonalMapSelect_WithData } from '../../Store/main/personal';
import { MapUI } from '../../UI/@Shared/Maps/MapUI';
import { ProcessRehydrateData } from './StoreRehydrateProcessor';

// use this to intercept dispatches (for debugging)
/* let oldDispatch = store.dispatch;
store.dispatch = function(...args) {
	if (GetTimeSinceLoad() > 5)
		debugger;
	oldDispatch.apply(this, args);
}; */

// only use this if you actually need to change the action-data before it gets dispatched/applied (otherwise use [Mid/Post]DispatchAction)
export function PreDispatchAction(action: Action<any>) {
	MaybeLog(a => a.actions, () => `Dispatching: ${action.type} JSON:${ToJSON(action)}`);
}
export function MidDispatchAction(action: Action<any>, newState: RootState) {
	if (action.type == 'persist/REHYDRATE') {
		if (action['key'] == 'root_key') {
			ProcessRehydrateData(action.payload);
		}
	}
}

export function DoesURLChangeCountAsPageChange(oldURL: VURL, newURL: VURL) {
	if (oldURL == null) return true;
	if (oldURL.PathStr() != newURL.PathStr()) return true;

	/* let oldSyncLoadActions = GetSyncLoadActionsForURL(oldURL, directURLChange);
	let oldMapViewMergeAction = oldSyncLoadActions.find(a=>a.Is(ACTMapViewMerge));

	let newSyncLoadActions = GetSyncLoadActionsForURL(newURL, directURLChange);
	let newMapViewMergeAction = newSyncLoadActions.find(a=>a.Is(ACTMapViewMerge));

	let oldViewStr = oldURL.GetQueryVar("view");
	let oldURLWasTemp = oldViewStr == "";
	if (newMapViewMergeAction != oldMapViewMergeAction && !oldURLWasTemp) {
		//let oldFocused = GetFocusedNodePath(GetMapView(mapViewMergeAction.payload.mapID));
		let oldFocused = oldMapViewMergeAction ? GetFocusedNodePath(oldMapViewMergeAction.payload.mapView) : null;
		let newFocused = newMapViewMergeAction ? GetFocusedNodePath(newMapViewMergeAction.payload.mapView) : null;
		if (newFocused != oldFocused) return true;
	} */

	return false;
}
export function RecordPageView(url: VURL) {
	// let url = window.location.pathname;
	if (PROD) {
		// todo: ms if react-ga is not initialized yet, we buffer up these commands, then run them once it is initialized
		ReactGA.set({ page: url.toString({ domain: false }) });
		ReactGA.pageview(url.toString({ domain: false }) || '/');
	}
	MaybeLog(a => a.pageViews, () => `Page-view: ${url}`);
}

let postInitCalled = false;
export async function PostDispatchAction(action: Action<any>) {
	let pageViewTracker_lastURL: VURL;
	if (!postInitCalled) {
		PostInit();
		postInitCalled = true;
	}

	const url = GetCurrentURL();
	// let oldURL = URL.Current();
	// let url = VURL.FromLocationObject(action.payload.location);
	const simpleURL = GetCurrentURL_SimplifiedForPageViewTracking();
	if (DoesURLChangeCountAsPageChange(pageViewTracker_lastURL, simpleURL)) {
		pageViewTracker_lastURL = simpleURL;
		RecordPageView(simpleURL);
	}

	if (action.type == 'PostRehydrate') { // triggered by vwebapp-framework/ActionProcessor
		if (!hasHotReloaded) {
			LoadURL(startURL);
		}
		// UpdateURL(false);
		if (PROD && State('main', 'analyticsEnabled')) {
			Log('Initialized Google Analytics.');
			// ReactGA.initialize("UA-21256330-33", {debug: true});
			ReactGA.initialize('UA-21256330-33');

			/* let url = VURL.FromLocationObject(State().router).toString(false);
			ReactGA.set({page: url});
			ReactGA.pageview(url || "/"); */
		}
	}

	if (action.Is(ACTPersonalMapSelect) || action.Is(ACTDebateMapSelect)) {
		const map = action.payload.id ? await GetDataAsync('maps', action.payload.id) as Map : null;
		const actionType = action.Is(ACTPersonalMapSelect) ? ACTPersonalMapSelect_WithData : ACTDebateMapSelect_WithData;
		store.dispatch(new actionType({ id: action.payload.id, map }));

		if (map) {
			let pathsToExpand = [`${map.rootNode}`];
			for (let depth = 0; depth < map.defaultExpandDepth; depth++) {
				const newPathsToExpand = [];
				for (const path of pathsToExpand) {
					const nodeID = path.split('/').Last();
					const node = await GetAsync(() => GetNodeL2(nodeID));
					if (GetNodeView(map._key, path) == null) {
						store.dispatch(new ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: true, recursive: false }));
					}
					if (node.children) {
						newPathsToExpand.push(...node.children.VKeys(true).map(childID => `${path}/${childID}`));
					}
				}
				pathsToExpand = newPathsToExpand;
			}
		}
	}
	if (action.Is(ACTMapNodeExpandedSet)) {
		const { path } = action.payload;
		const nodeID = GetNodeID(path);
		const node = GetNodeL2(nodeID) || await GetAsync(() => GetNodeL2(nodeID));
		const expandKey = ['expanded', 'expanded_truth', 'expanded_relevance'].find(key => action.payload[key] != null);

		// if we're expanding a claim-node, make sure any untouched truth-arguments start expanded
		if (node.type == MapNodeType.Claim && action.payload[expandKey]) {
			const children = GetNodeChildrenL2(node).every(a => a != null) ? GetNodeChildrenL2(node) : await GetAsync(() => GetNodeChildrenL2(node));
			const actions = [];
			for (const child of children) {
				const childPath = `${action.payload.path}/${child._key}`;
				const childNodeView = (GetNodeView(action.payload.mapID, childPath) || await GetAsync(() => GetNodeView(action.payload.mapID, childPath))) || {};
				if (child && child.type == MapNodeType.Argument && childNodeView.expanded == null) {
					actions.push(new ACTMapNodeExpandedSet({ mapID: action.payload.mapID, path: childPath, expanded: true, recursive: false }));
				}
			}
			store.dispatch(new ActionSet(...actions));
		}
		// if we're expanding an argument-node, make sure any untouched relevance-arguments start expanded
		/* else if (node.type == MapNodeType.Argument) {
		} */
	}

	const loadingMapView = action.Is(ACTMapViewMerge);
	if (loadingMapView) {
		// const mapUI = FindReact($('.MapUI')[0]) as MapUI;
		const mapUI = MapUI.CurrentMapUI;
		if (mapUI) {
			mapUI.LoadScroll();
		}
	}

	/* let movingToGlobals = false;
	if (action.type == LOCATION_CHANGED) {
		if (!lastPath.startsWith("/global") && action.payload.pathname.startsWith("/global"))
			movingToGlobals = true;
		lastPath = action.payload.pathname;
	}
	if (movingToGlobals || action.IsAny(ACTMapNodeSelect, ACTMapNodePanelOpen, ACTMapNodeExpandedSet, ACTViewCenterChange)) {
		setTimeout(()=>UpdateURL_Globals());
	} */
	/* let pushURL_actions = [
		ACTSetPage, ACTSetSubpage, // general
		ACTTermSelect, ACTImageSelect, // content
		//ACTDebateMapSelect, // debates
		ACTDebateMapSelect_WithData, // debates
	];
	let replaceURL_actions = [
		ACTMapNodeSelect, ACTMapNodePanelOpen, ACTMapNodeExpandedSet, ACTViewCenterChange, // global
	];
	let isPushURLAction = action.IsAny(...pushURL_actions);
	let isReplaceURLAction = action.IsAny(...replaceURL_actions);
	if (isPushURLAction || isReplaceURLAction) {
		UpdateURL(isPushURLAction && !action["fromURL"]);
	} */

	if (action.type == '@@reactReduxFirebase/LOGIN') {
		const userID = action['auth'].uid;
		const joinDate = await GetDataAsync('userExtras', userID, '.joinDate');
		if (joinDate == null) {
			// todo: improve this; perhaps create an InitUser command, with the server doing the actual permission setting and such
			/* const firebase = store.firebase.helpers;
			firebase.ref(DBPath(`userExtras/${userID}`)).update({
				permissionGroups: { basic: true, verified: true, mod: false, admin: false },
				joinDate: Date.now(),
			}); */
			firestoreDB.doc(DBPath(`userExtras/${userID}`)).set({
				permissionGroups: { basic: true, verified: true, mod: false, admin: false },
				joinDate: Date.now(),
			}, { merge: true });
		}

		// Raven.setUserContext(action["auth"].Including("uid", "displayName", "email"));
	} /* else if (action.type == "@@reactReduxFirebase/LOGOUT") {
		Raven.setUserContext();
	} */

	/* if (action.type == "@@reactReduxFirebase/SET" && action["data"] == null) {
		// remove the property from the store, if it is just null anyway (this makes it consistent with how firebase returns the whole db-state)
	} */

	/* if (action.Is(ACTViewCenterChange) || action.Is(ACTMapNodeSelect)) {
		let simpleURL = GetSimpleURLForCurrentMapView();
		RecordPageView(simpleURL);
	} */

	if (action.Is(ACTMap_PlayingTimelineStepSet) || action.Is(ACTMap_PlayingTimelineAppliedStepSet)) {
		const newlyRevealedNodes = await GetAsync(() => GetPlayingTimelineCurrentStepRevealNodes(action.payload.mapID));
		// stats=>Log("Requested paths:\n==========\n" + stats.requestedPaths.VKeys().join("\n") + "\n\n"));
		ExpandToAndFocusOnNodes(action.payload.mapID, newlyRevealedNodes);
	}
}

async function ExpandToAndFocusOnNodes(mapID: string, paths: string[]) {
	const { UpdateFocusNodeAndViewOffset } = require('../../UI/@Shared/Maps/MapUI'); // eslint-disable-line

	for (const path of paths) {
		const parentPath = path.split('/').slice(0, -1).join('/');
		store.dispatch(new ACTMapNodeExpandedSet({ mapID, path: parentPath, expanded: true, recursive: false }));
	}

	for (let i = 0; i < 30 && $('.MapUI').length == 0; i++) { await SleepAsync(100); }
	/* const mapUIEl = $('.MapUI');
	if (mapUIEl.length == 0) return;
	const mapUI = FindReact(mapUIEl[0]) as MapUI; */
	const mapUI = MapUI.CurrentMapUI;
	if (mapUI == null) return;

	for (let i = 0; i < 30 && paths.map(path => mapUI.FindNodeBox(path)).Any(a => a == null); i++) { await SleepAsync(100); }
	const nodeBoxes = paths.map(path => mapUI.FindNodeBox(path)).filter(a => a != null);
	if (nodeBoxes.length == 0) return;

	let nodeBoxPositionSum = new Vector2i(0, 0);
	for (const box of nodeBoxes) {
		const boxPos = $(GetDOM(box)).GetScreenRect().Center.Minus($(mapUI.DOM).GetScreenRect().Position);
		nodeBoxPositionSum = nodeBoxPositionSum.Plus(boxPos);
	}
	const nodeBoxPositionAverage = nodeBoxPositionSum.Times(1 / paths.length);
	// mapUI.ScrollToPosition(new Vector2i((nodeBoxPositionAverage.x - 100).KeepAtLeast(0), nodeBoxPositionAverage.y));
	mapUI.ScrollToPosition_Center(nodeBoxPositionAverage.Plus(-250, 0));
	UpdateFocusNodeAndViewOffset(mapID);
}

function PostInit() {
	let lastAuth;
	let lastMapView;
	let lastContextData; // only gets updated when one of the above components change
	store.subscribe(() => {
		const auth = GetAuth();
		const mapView = GetMapView(GetOpenMapID());

		let newContextData;
		const ExtendNewContextData = (newData) => {
			if (newContextData == null) newContextData = Clone(lastContextData || {});
			newContextData.Extend(newData);
		};
		// if (auth != lastAuth) ExtendNewContextData(auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null);
		if (auth != lastAuth) ExtendNewContextData({ auth: auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null });
		if (mapView != lastMapView) ExtendNewContextData({ mapView });

		if (newContextData != null) {
			Log('Setting user-context: ', newContextData);
			Raven.setUserContext(newContextData);
			lastContextData = newContextData;
		}

		lastAuth = auth;
		lastMapView = mapView;
	});
}
