import { GetAsync, ListenerPathToPath } from 'Frame/Database/DatabaseHelpers';
import { SplitStringBySlash_Cached } from 'Frame/Database/StringSplitCache';
import { SleepAsync, Vector2i, VURL } from 'js-vextensions';
import Raven from 'raven-js';
import ReactGA from 'react-ga';
import { FindReact } from 'react-vextensions';
import { LOCATION_CHANGED } from 'redux-little-router';
import { GetAuth, IsAuthValid, DoesActionSetFirestoreData } from 'Store/firebase';
import { GetNodeChildrenL2, GetNodeID } from 'Store/firebase/nodes';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { Map } from '../../Store/firebase/maps/@Map';
import { ApplyActionSet, RootState } from '../../Store/index';
import { ACTDebateMapSelect, ACTDebateMapSelect_WithData } from '../../Store/main/debates';
import { ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineCurrentStepRevealNodes } from '../../Store/main/maps/$map';
import { GetNodeView } from '../../Store/main/mapViews';
import { ACTMapNodeExpandedSet } from '../../Store/main/mapViews/$mapView/rootNodeViews';
import { ACTPersonalMapSelect, ACTPersonalMapSelect_WithData } from '../../Store/main/personal';
import { MapUI } from '../../UI/@Shared/Maps/MapUI';
import { DBPath, GetDataAsync, ProcessDBData } from '../Database/DatabaseHelpers';
import { Action } from '../General/Action';
import { GetCurrentURL } from '../General/URLs';
import { GetCurrentURL_SimplifiedForPageViewTracking, LoadURL } from '../URL/URLManager';

// use this to intercept dispatches (for debugging)
/* let oldDispatch = store.dispatch;
store.dispatch = function(...args) {
	if (GetTimeSinceLoad() > 5)
		debugger;
	oldDispatch.apply(this, args);
}; */

const lastPath = '';
// export function ProcessAction(action: Action<any>, newState: RootState, oldState: RootState) {
// only use this if you actually need to change the action-data before it gets dispatched/applied (otherwise use [Mid/Post]DispatchAction)
export function PreDispatchAction(action: Action<any>) {
	MaybeLog(a => a.actions, () => `Dispatching: ${action.type} JSON:${ToJSON(action)}`);

	if (DoesActionSetFirestoreData(action)) {
		if (action.payload.data) {
			// "subcollections" prop currently bugged in some cases, so just use new "path" prop when available
			const path = action['meta'].path || ListenerPathToPath(action['meta']);

			action.payload.data = ProcessDBData(action.payload.data, true, true, SplitStringBySlash_Cached(path).Last());
		} /* else {
			// don't add the property to the store, if it is just null anyway (this makes it consistent with how firebase returns the whole db-state)
			delete action.payload.data;
		} */
	}

	/* if (g.actionStacks || (DEV && !actionStacks_actionTypeIgnorePatterns.Any(a=>action.type.startsWith(a)))) {
		action["stack"] = new Error().stack.split("\n").slice(1); // add stack, so we can inspect in redux-devtools
	} */
}
export function MidDispatchAction(action: Action<any>, newState: RootState) {
}

export function DoesURLChangeCountAsPageChange(oldURL: VURL, newURL: VURL, directURLChange: boolean) {
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
	// let url = VURL.FromState(action.payload);
	const simpleURL = GetCurrentURL_SimplifiedForPageViewTracking();
	if (DoesURLChangeCountAsPageChange(pageViewTracker_lastURL, simpleURL, true)) {
		pageViewTracker_lastURL = simpleURL;
		RecordPageView(simpleURL);
	}

	// if (action.type == "@@INIT") {
	// if (action.type == "persist/REHYDRATE" && GetPath().startsWith("global/map"))
	if (action.type == 'persist/REHYDRATE') {
		store.dispatch({ type: 'PostRehydrate' }); // todo: ms this also gets triggered when there is no saved-state (ie, first load)
	}
	if (action.type == 'PostRehydrate') {
		if (!hasHotReloaded) {
			LoadURL(startURL.toString());
		}
		// UpdateURL(false);
		if (PROD && State('main', 'analyticsEnabled')) {
			Log('Initialized Google Analytics.');
			// ReactGA.initialize("UA-21256330-33", {debug: true});
			ReactGA.initialize('UA-21256330-33');

			/* let url = VURL.FromState(State().router).toString(false);
			ReactGA.set({page: url});
			ReactGA.pageview(url || "/"); */
		}
	}
	// is triggered by back/forward navigation, as well things that call store.dispatch([push/replace]()) -- such as UpdateURL()
	if (action.type == LOCATION_CHANGED) {
		/* if (g.justChangedURLFromCode) {
			g.justChangedURLFromCode = false;
		} else { */
		if (!(action as any).payload.byCode) {
			// setTimeout(()=>UpdateURL());
			await LoadURL(url.toString());
			// UpdateURL(false);
			if (url.toString({ domain: false }).startsWith('/global/map')) {
				if (isBot) {
					/* let newURL = url.Clone();
					let node = await GetNodeAsync(nodeID);
					let node = await GetNodeAsync(nodeID);
					newURL.pathNodes[1] = "";
					store.dispatch(replace(newURL.toString(false))); */
				} else {
					// we don't yet have a good way of knowing when loading is fully done; so just do a timeout
					/* WaitXThenRun(0, UpdateURL, 200);
					WaitXThenRun(0, UpdateURL, 400);
					WaitXThenRun(0, UpdateURL, 800);
					WaitXThenRun(0, UpdateURL, 1600); */
				}
			}
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
					const nodeID = path.split('/').Last().ToInt();
					const node = await GetAsync(() => GetNodeL2(nodeID));
					if (GetNodeView(map._id, path) == null) {
						store.dispatch(new ACTMapNodeExpandedSet({ mapID: map._id, path, expanded: true, recursive: false }));
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
		const path = action.payload.path;
		const nodeID = GetNodeID(path);
		const node = GetNodeL2(nodeID) || await GetAsync(() => GetNodeL2(nodeID));
		const expandKey = ['expanded', 'expanded_truth', 'expanded_relevance'].find(key => action.payload[key] != null);

		// if we're expanding a claim-node, make sure any untouched truth-arguments start expanded
		if (node.type == MapNodeType.Claim && action.payload[expandKey]) {
			const children = GetNodeChildrenL2(node).every(a => a != null) ? GetNodeChildrenL2(node) : await GetAsync(() => GetNodeChildrenL2(node));
			const actions = [];
			for (const child of children) {
				const childPath = `${action.payload.path}/${child._id}`;
				const childNodeView = (GetNodeView(action.payload.mapID, childPath) || await GetAsync(() => GetNodeView(action.payload.mapID, childPath))) || {};
				if (child && child.type == MapNodeType.Argument && childNodeView.expanded == null) {
					actions.push(new ACTMapNodeExpandedSet({ mapID: action.payload.mapID, path: childPath, expanded: true, recursive: false }));
				}
			}
			store.dispatch(new ApplyActionSet(actions));
		}
		// if we're expanding an argument-node, make sure any untouched relevance-arguments start expanded
		/* else if (node.type == MapNodeType.Argument) {
		} */
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
		const joinDate = await GetDataAsync('userExtras', userID, 'joinDate');
		if (joinDate == null) {
			const firebase = store.firebase.helpers;
			firebase.ref(DBPath(`userExtras/${userID}`)).update({
				permissionGroups: { basic: true, verified: true, mod: false, admin: false },
				joinDate: Date.now(),
			});
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

async function ExpandToAndFocusOnNodes(mapID: number, paths: string[]) {
	const { UpdateFocusNodeAndViewOffset } = require('../../UI/@Shared/Maps/MapUI'); // eslint-disable-line

	for (const path of paths) {
		const parentPath = path.split('/').slice(0, -1).join('/');
		store.dispatch(new ACTMapNodeExpandedSet({ mapID, path: parentPath, expanded: true, recursive: false }));
	}

	for (var i = 0; i < 30 && $('.MapUI').length == 0; i++) { await SleepAsync(100); }
	const mapUIEl = $('.MapUI');
	if (mapUIEl.length == 0) return;
	const mapUI = FindReact(mapUIEl[0]) as MapUI;

	for (var i = 0; i < 30 && paths.map(path => mapUI.FindNodeBox(path)).Any(a => a == null); i++) { await SleepAsync(100); }
	const nodeBoxes = paths.map(path => mapUI.FindNodeBox(path)).filter(a => a != null);
	if (nodeBoxes.length == 0) return;

	let nodeBoxPositionSum = new Vector2i(0, 0);
	for (const box of nodeBoxes) {
		const boxPos = $(GetDOM(box)).GetScreenRect().Center.Minus(mapUIEl.GetScreenRect().Position);
		nodeBoxPositionSum = nodeBoxPositionSum.Plus(boxPos);
	}
	const nodeBoxPositionAverage = nodeBoxPositionSum.Times(1 / paths.length);
	// mapUI.ScrollToPosition(new Vector2i((nodeBoxPositionAverage.x - 100).KeepAtLeast(0), nodeBoxPositionAverage.y));
	mapUI.ScrollToPosition_Center(nodeBoxPositionAverage.Plus(-250, 0));
	UpdateFocusNodeAndViewOffset(mapID);
}

function PostInit() {
	let lastAuth;
	// Log("Subscribed");
	store.subscribe(() => {
		const auth = GetAuth();
		if (IsAuthValid(auth) && auth != lastAuth) {
			// Log("Setting user-context: " + auth);
			// Raven.setUserContext(auth);
			Raven.setUserContext(auth.Including('uid', 'displayName', 'email', 'photoURL'));
			lastAuth = auth;
		}
	});
}
