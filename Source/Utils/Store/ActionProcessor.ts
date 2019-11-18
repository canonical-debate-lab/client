import { SleepAsync, Vector2i, VURL, ToJSON, Clone, VRect } from 'js-vextensions';
import { hasHotReloaded } from 'Main';
import Raven from 'raven-js';
import ReactGA from 'react-ga';
import { FindReact, GetDOM } from 'react-vextensions';
import { GetAuth, IsAuthValid } from 'Store_Old/firebase';
import { GetNodeChildrenL2, GetNodeID } from 'Store_Old/firebase/nodes';
import { GetNodeL2 } from 'Store_Old/firebase/nodes/$node';
import { MapNodeType } from 'Store_Old/firebase/nodes/@MapNodeType';
import { ACTMapViewMerge } from 'Store_Old/main/mapViews/$mapView';
import { Action, ActionSet, DBPath, GetAsync, GetCurrentURL, GetDataAsync, LoadURL, MaybeLog, State, GetScreenRect, SlicePath } from 'Utils/FrameworkOverrides';
import { GetCurrentURL_SimplifiedForPageViewTracking } from 'Utils/URL/URLs';
import { GetOpenMapID } from 'Store_Old/main';
import { NodeUI_Inner } from 'UI/@Shared/Maps/MapNode/NodeUI_Inner';
import { GetTimelineStep } from 'Store_Old/firebase/timelines';
import { store } from 'Store';
import { Map } from '../../Store_Old/firebase/maps/@Map';
import { RootState } from '../../Store_Old/index';
import { ACTDebateMapSelect, ACTDebateMapSelect_WithData } from '../../Store_Old/main/debates';
import { ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineCurrentStepRevealNodes, GetPlayingTimeline, GetNodesRevealedInSteps } from '../../Store_Old/main/maps/$map';
import { GetNodeView, GetMapView } from '../../Store_Old/main/mapViews';
import { ACTMapNodeExpandedSet } from '../../Store_Old/main/mapViews/$mapView/rootNodeViews';
import { ACTPersonalMapSelect, ACTPersonalMapSelect_WithData } from '../../Store_Old/main/personal';
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
	MaybeLog((a) => a.actions, () => `Dispatching: ${action.type} JSON:${ToJSON(action)}`);
}
export function MidDispatchAction(action: Action<any>, newState: RootState) {
	if (action.type == 'persist/REHYDRATE') {
		if (action['key'] == 'root_key') {
			ProcessRehydrateData(action.payload);
		}
	}

	if (action.Is(ACTPersonalMapSelect) || action.Is(ACTDebateMapSelect)) {
		// ACTEnsureMapStateInit(action.payload.id);
		// storeM.ACTEnsureMapStateInit(action.payload.id);
		store.main.ACTEnsureMapStateInit(action.payload.id);
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
	MaybeLog((a) => a.pageViews, () => `Page-view: ${url}`);
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
						store.dispatch(new ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: true, resetSubtree: false }));
					}
					if (node.children) {
						newPathsToExpand.push(...node.children.VKeys(true).map((childID) => `${path}/${childID}`));
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
		const expandKey = ['expanded', 'expanded_truth', 'expanded_relevance'].find((key) => action.payload[key] != null);

		// if we're expanding a claim-node, make sure any untouched truth-arguments start expanded
		/* if (node.type == MapNodeType.Claim && action.payload[expandKey]) {
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
		} */
		// if we're expanding an argument-node, make sure any untouched relevance-arguments start expanded
		/* else if (node.type == MapNodeType.Argument) {
		} */
	}

	const loadingMapView = action.Is(ACTMapViewMerge);
	if (loadingMapView) {
		// const mapUI = FindReact($('.MapUI')[0]) as MapUI;
		const mapUI = MapUI.CurrentMapUI;
		if (mapUI) {
			mapUI.LoadStoredScroll();
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
		// const newlyRevealedNodes = await GetAsync(() => GetPlayingTimelineCurrentStepRevealNodes(action.payload.mapID));
		// we have to break it into parts, otherwise the current-step might change while we're doing the processing, short-circuiting the expansion
		const step = await GetAsync(() => {
			// const playingTimeline_currentStep = GetPlayingTimelineStep(mapID);
			const timeline = GetPlayingTimeline(action.payload.mapID);
			const stepID = timeline.steps[action.payload.stepIndex];
			return GetTimelineStep(stepID);
		});
		const newlyRevealedNodes = await GetAsync(() => GetNodesRevealedInSteps([step]));
		// Log(`@Step(${step._key}) @NewlyRevealedNodes(${newlyRevealedNodes})`);
		if (newlyRevealedNodes.length) {
			// stats=>Log("Requested paths:\n==========\n" + stats.requestedPaths.VKeys().join("\n") + "\n\n"));
			ExpandToAndFocusOnNodes(action.payload.mapID, newlyRevealedNodes);
		}
	}
}

async function ExpandToAndFocusOnNodes(mapID: string, paths: string[]) {
	const { UpdateFocusNodeAndViewOffset } = require('../../UI/@Shared/Maps/MapUI'); // eslint-disable-line

	const actions = [];
	for (const path of paths) {
		const parentPath = SlicePath(path, 1);
		actions.push(new ACTMapNodeExpandedSet({ mapID, path: parentPath, expanded: true, expandAncestors: true }));
	}
	store.dispatch(new ActionSet(...actions));

	let mapUI: MapUI;
	for (let i = 0; i < 30 && mapUI == null; i++) {
		if (i > 0) await SleepAsync(100);
		mapUI = MapUI.CurrentMapUI;
	}
	if (mapUI == null) {
		Log('Failed to find MapUI to apply scroll to.');
		return;
	}

	let nodeBoxes: NodeUI_Inner[] = [];
	for (let i = 0; i < 30 && nodeBoxes.length < paths.length; i++) {
		if (i > 0) await SleepAsync(100);
		nodeBoxes = paths.map((path) => mapUI.FindNodeBox(path)).filter((a) => a != null && GetDOM(a));
	}
	if (nodeBoxes.length == 0) {
		Log('Failed to find any of the NodeBoxes to apply scroll to. Paths:', paths);
		return;
	}

	let nodeBoxesMerged: VRect;
	for (const box of nodeBoxes) {
		// const boxPos = GetScreenRect(GetDOM(box)).Center.Minus(GetScreenRect(mapUI.mapUIEl).Position);
		const boxRect = GetScreenRect(GetDOM(box)).NewPosition((a) => a.Minus(GetScreenRect(mapUI.mapUIEl).Position));
		nodeBoxesMerged = nodeBoxesMerged ? nodeBoxesMerged.Encapsulating(boxRect) : boxRect;
	}
	/* const nodeBoxPositionAverage = nodeBoxPositionSum.Times(1 / paths.length);
	// mapUI.ScrollToPosition(new Vector2i((nodeBoxPositionAverage.x - 100).KeepAtLeast(0), nodeBoxPositionAverage.y));
	mapUI.ScrollToPosition_Center(nodeBoxPositionAverage.Plus(-250, 0)); */
	mapUI.ScrollToMakeRectVisible(nodeBoxesMerged, 100);
	UpdateFocusNodeAndViewOffset(mapID);
}

function PostInit() {
	let lastAuth;
	let lastMapView;
	let lastContextData; // only gets updated when one of the above components change
	store.subscribe(() => {
		const auth = GetAuth();
		const mapView = GetOpenMapID() ? GetMapView(GetOpenMapID()) : null;

		let newContextData;
		const ExtendNewContextData = (newData) => {
			if (newContextData == null) newContextData = Clone(lastContextData || {});
			newContextData.Extend(newData);
		};
		// if (auth != lastAuth) ExtendNewContextData(auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null);
		if (auth != lastAuth) ExtendNewContextData({ auth: auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null });
		if (mapView != lastMapView) ExtendNewContextData({ mapView });

		if (newContextData != null) {
			// Log('Setting user-context: ', newContextData);
			Raven.setUserContext(newContextData);
			lastContextData = newContextData;
		}

		lastAuth = auth;
		lastMapView = mapView;
	});
}
