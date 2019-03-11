import { Assert, CachedTransform, GetTreeNodesInObjTree, IsNumberString, Vector2i, IsNumber, IsString } from 'js-vextensions';
import { ShallowChanged } from 'react-vextensions';
import { Action, DBPath, SplitStringBySlash_Cached, State, DoesActionSetFirestoreData, GetFirestoreDataSetterActionPath, Validate } from 'Utils/FrameworkOverrides';
import { ACTDebateMapSelect_WithData } from './debates';
import { ACTMapViewMerge, MapViewReducer } from './mapViews/$mapView';
import { MapNodeView, MapView, MapViews } from './mapViews/@MapViews';
import { ACTPersonalMapSelect_WithData } from './personal';

export function MapViewsReducer(state = new MapViews(), action: Action<any>) {
	/* if (action.Is(ACTOpenMapSet))
		return {...state, [action.payload]: state[action.payload] || new MapView()}; */

	const newState = { ...state };

	// if (action.type == '@@reactReduxFirebase/SET' && action['data']) {
	if (DoesActionSetFirestoreData(action) && action.payload.data) {
		const path = GetFirestoreDataSetterActionPath(action);
		const match = path.match(`^${DBPath('maps')}/([A-Za-z0-9_-]+)`);
		// if map-data was just loaded
		if (match) {
			const mapID = parseInt(match[1]);
			// and no map-view exists for it yet, create one (by expanding root-node, and changing focus-node/view-offset)
			// if (GetMapView(mapID) == null) {
			// if (state[mapID].rootNodeViews.VKeys().length == 0) {
			if (newState[mapID] == null) {
				// newState[mapID] = new MapView();
				newState[mapID] = {
					rootNodeViews: {
						[action.payload.data.rootNode]: new MapNodeView().VSet({ expanded: true, focused: true, viewOffset: new Vector2i(200, 0) }),
					},
				};
			}
		}
	}
	if ((action.Is(ACTPersonalMapSelect_WithData) || action.Is(ACTDebateMapSelect_WithData)) && action.payload.map) {
		if (newState[action.payload.id] == null) {
			// newState[action.payload.id] = new MapView();
			newState[action.payload.id] = {
				rootNodeViews: {
					[action.payload.map.rootNode]: new MapNodeView().VSet({ expanded: true, focused: true, viewOffset: new Vector2i(200, 0) }),
				},
			};
		}
	}
	/* if (action.type == LOCATION_CHANGED && VURL.FromLocationObject(action.payload.location).pathNodes[0] == "global") {
		let mapID = 1, rootNode = 1;
		// if no map-view exists for it yet, create one (by expanding root-node, and changing focus-node/view-offset)
		if (newState[mapID] == null) {
			newState[mapID] = {
				rootNodeViews: {
					[rootNode]: new MapNodeView().VSet({expanded: true, focused: true, viewOffset: new Vector2i(200, 0)})
				}
			};
		}
	} */
	if (action.Is(ACTMapViewMerge)) {
		if (newState[action.payload.mapID] == null) {
			newState[action.payload.mapID] = action.payload.mapView;
		}
	}

	for (const key in newState) {
		newState[key] = MapViewReducer(newState[key], action, key);
	}
	return ShallowChanged(newState, state) ? newState : state;
}

// selectors
// ==========

export function GetPathNodes(path: string) {
	const pathSegments = SplitStringBySlash_Cached(path);
	Assert(pathSegments.every(a => Validate('UUID', a) == null || a[0] == '*'), `Path contains non-uuid, non-*-prefixed segments: ${path}`);
	// return pathSegments.map(ToInt);
	return pathSegments;
}
export function PathSegmentToNodeID(segment: string) {
	if (segment.length == 22) return segment;
	if (segment.length == 23) return segment.slice(1);
	Assert(false, 'Segment text is invalid.');
}
export function GetPathNodeIDs(path: string) {
	const nodes = GetPathNodes(path);
	return nodes.map(a => PathSegmentToNodeID(a));
}

export function GetSelectedNodePathNodes(mapViewOrMapID: string | MapView): string[] {
	const mapView = IsString(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	return CachedTransform('GetSelectedNodePathNodes', [], { rootNodeViews: mapView.rootNodeViews }, () => {
		const selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'selected' && a.Value);
		if (selectedTreeNode == null) return [];

		const selectedNodeView = selectedTreeNode.ancestorNodes.Last();
		// return selectedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(selectedNodeView.PathNodes);
	});
}
export function GetSelectedNodePath(mapViewOrMapID: string | MapView): string {
	return GetSelectedNodePathNodes(mapViewOrMapID).join('/');
}
export function GetSelectedNodeID(mapID: string): string {
	return PathSegmentToNodeID(GetSelectedNodePathNodes(mapID).LastOrX());
}

export function GetPathFromDataPath(dataPathUnderRootNodeViews: string[]): string[] {
	const result = [];
	for (const [index, prop] of dataPathUnderRootNodeViews.entries()) {
		if (index == 0) { // first one is the root-node-id
			result.push(prop);
		} else if (prop == 'children') {
			result.push(dataPathUnderRootNodeViews[index + 1]);
		}
	}
	return result;
}

export function GetFocusedNodePathNodes(mapViewOrMapID: string | MapView): string[] {
	const mapView = IsString(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	return CachedTransform('GetFocusedNodePathNodes', [], { rootNodeViews: mapView.rootNodeViews }, () => {
		const focusedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'focused' && a.Value);
		if (focusedTreeNode == null) return [];

		const focusedNodeView = focusedTreeNode.ancestorNodes.Last();
		// return focusedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(focusedNodeView.PathNodes);
	});
}
export function GetFocusedNodePath(mapViewOrMapID: string | MapView): string {
	return GetFocusedNodePathNodes(mapViewOrMapID).join('/').toString(); // toString() needed if only 1 item
}
export function GetFocusedNodeID(mapID: string): string {
	const focusedNodeStr = GetFocusedNodePathNodes(mapID).LastOrX();
	return focusedNodeStr ? PathSegmentToNodeID(focusedNodeStr) : null;
}

export function GetMapView(mapID: string): MapView {
	return State('main', 'mapViews', mapID);
}
export function GetNodeViewDataPath(mapID: string, path: string): string[] {
	const pathNodes = GetPathNodes(path);
	// this has better perf than the simpler approaches
	// let childPath = pathNodeIDs.map(childID=>`${childID}/children`).join("/").slice(0, -"/children".length);
	const childPathNodes = pathNodes.SelectMany(nodeStr => ['children', nodeStr]).slice(1);
	return ['main', 'mapViews', `${mapID}`, 'rootNodeViews', ...childPathNodes];
}
export function GetNodeView(mapID: string, path: string): MapNodeView {
	const dataPath = GetNodeViewDataPath(mapID, path);
	return State(...dataPath) as any;
}
export function GetViewOffset(mapView: MapView): Vector2i {
	if (mapView == null) return null;
	const treeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'viewOffset' && a.Value);
	return treeNode ? treeNode.Value : null;
}
