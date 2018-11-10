import { SplitStringBySlash_Cached } from 'Frame/Database/StringSplitCache';
import { Assert, CachedTransform, GetTreeNodesInObjTree, IsNumberString, Vector2i } from 'js-vextensions';
import { ShallowChanged } from 'react-vextensions';
import { DBPath } from '../../Frame/Database/DatabaseHelpers';
import Action from '../../Frame/General/Action';
import { ACTDebateMapSelect_WithData } from './debates';
import { ACTMapViewMerge, MapViewReducer } from './mapViews/$mapView';
import { MapNodeView, MapView, MapViews } from './mapViews/@MapViews';
import { ACTPersonalMapSelect_WithData } from './personal';

export function MapViewsReducer(state = new MapViews(), action: Action<any>) {
	/* if (action.Is(ACTOpenMapSet))
		return {...state, [action.payload]: state[action.payload] || new MapView()}; */

	const newState = { ...state };

	if (action.type == '@@reactReduxFirebase/SET' && action['data']) {
		const match = action['path'].match(`^${DBPath('maps')}/([0-9]+)`);
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
						[action['data'].rootNode]: new MapNodeView().VSet({ expanded: true, focused: true, viewOffset: new Vector2i(200, 0) }),
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
	/* if (action.type == LOCATION_CHANGED && VURL.FromState(action.payload).pathNodes[0] == "global") {
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
		newState[key] = MapViewReducer(newState[key], action, parseInt(key));
	}
	return ShallowChanged(newState, state) ? newState : state;
}

// selectors
// ==========

export function GetPathNodes(path: string) {
	const pathSegments = SplitStringBySlash_Cached(path);
	Assert(pathSegments.every(a => IsNumberString(a) || a[0] == 'L'), `Path contains non-number, non-L-prefixed segments: ${path}`);
	// return pathSegments.map(ToInt);
	return pathSegments;
}
export function GetPathNodeIDs(path: string) {
	const nodes = GetPathNodes(path);
	return nodes.map(a => parseInt(a.replace('L', '')));
}

export function GetSelectedNodePathNodes(mapViewOrMapID: number | MapView): string[] {
	const mapView = IsNumber(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	return CachedTransform('GetSelectedNodePathNodes', [], { rootNodeViews: mapView.rootNodeViews }, () => {
		const selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'selected' && a.Value);
		if (selectedTreeNode == null) return [];

		const selectedNodeView = selectedTreeNode.ancestorNodes.Last();
		// return selectedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(selectedNodeView.PathNodes);
	});
}
export function GetSelectedNodePath(mapViewOrMapID: number | MapView): string {
	return GetSelectedNodePathNodes(mapViewOrMapID).join('/');
}
export function GetSelectedNodeID(mapID: number): number {
	return GetSelectedNodePathNodes(mapID).LastOrX().replace('L', '').ToInt();
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

export function GetFocusedNodePathNodes(mapViewOrMapID: number | MapView): string[] {
	const mapView = IsNumber(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	return CachedTransform('GetFocusedNodePathNodes', [], { rootNodeViews: mapView.rootNodeViews }, () => {
		const focusedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'focused' && a.Value);
		if (focusedTreeNode == null) return [];

		const focusedNodeView = focusedTreeNode.ancestorNodes.Last();
		// return focusedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(focusedNodeView.PathNodes);
	});
}
export function GetFocusedNodePath(mapViewOrMapID: number | MapView): string {
	return GetFocusedNodePathNodes(mapViewOrMapID).join('/').toString(); // toString() needed if only 1 item
}
export function GetFocusedNodeID(mapID: number): number {
	const focusedNodeStr = GetFocusedNodePathNodes(mapID).LastOrX();
	return focusedNodeStr ? focusedNodeStr.replace('L', '').ToInt() : null;
}

export function GetMapView(mapID: number): MapView {
	return State('main', 'mapViews', mapID);
}
export function GetNodeViewDataPath(mapID: number, path: string): string[] {
	const pathNodes = GetPathNodes(path);
	// this has better perf than the simpler approaches
	// let childPath = pathNodeIDs.map(childID=>`${childID}/children`).join("/").slice(0, -"/children".length);
	const childPathNodes = pathNodes.SelectMany(nodeStr => ['children', nodeStr]).slice(1);
	return ['main', 'mapViews', `${mapID}`, 'rootNodeViews', ...childPathNodes];
}
export function GetNodeView(mapID: number, path: string): MapNodeView {
	const dataPath = GetNodeViewDataPath(mapID, path);
	return State(...dataPath) as any;
}
export function GetViewOffset(mapView: MapView): Vector2i {
	if (mapView == null) return null;
	const treeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a => a.prop == 'viewOffset' && a.Value);
	return treeNode ? treeNode.Value : null;
}
