import { Assert, CachedTransform, GetTreeNodesInObjTree, IsNumberString, Vector2i } from "js-vextensions";
import { ShallowChanged } from "react-vextensions";
import { SplitStringBySlash_Cached } from "Utils/Database/StringSplitCache";
import { DBPath } from "../../Utils/Database/DatabaseHelpers";
import { ACTMapViewMerge, MapViewReducer } from "./mapViews/$mapView";
import { MapNodeView, MapView, MapViews } from "./mapViews/@MapViews";
import { Action } from "Utils/Store/Action";
import { State } from "Store";

export function MapViewsReducer(state = new MapViews(), action: Action<any>) {
	let newState = {...state};

	if (action.type == "@@reactReduxFirebase/SET" && action["data"]) {
		let match = action["path"].match("^" + DBPath("maps") + "/([0-9]+)");
		// if map-data was just loaded
		if (match) {
			let mapID = parseInt(match[1]);
			// and no map-view exists for it yet, create one (by expanding root-node, and changing focus-node/view-offset)
			if (newState[mapID] == null) {
				newState[mapID] = {
					rootNodeViews: {
						[action["data"].rootNode]: new MapNodeView().VSet({expanded: true, focused: true, viewOffset: new Vector2i(200, 0)})
					}
				};
			}
		}
	}

	for (let key in newState) {
		newState[key] = MapViewReducer(newState[key], action, parseInt(key));
	}
	return ShallowChanged(newState, state) ? newState : state;
}

// selectors
// ==========

export function GetPathNodes(path: string) {
	let pathSegments = SplitStringBySlash_Cached(path);
	Assert(pathSegments.every(a=>IsNumberString(a) || a[0] == "L"), `Path contains non-number, non-L-prefixed segments: ${path}`);
	//return pathSegments.map(ToInt);
	return pathSegments;
}
export function GetPathNodeIDs(path: string) {
	let nodes = GetPathNodes(path);
	return nodes.map(a=>parseInt(a.replace("L", "")));
}

export function GetSelectedNodePathNodes(mapViewOrMapID: number | MapView): string[] {
	let mapView = IsNumber(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	return CachedTransform("GetSelectedNodePathNodes", [], {rootNodeViews: mapView.rootNodeViews}, ()=> {
		let selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a=>a.prop == "selected" && a.Value);
		if (selectedTreeNode == null) return [];

		let selectedNodeView = selectedTreeNode.ancestorNodes.Last();
		//return selectedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(selectedNodeView.PathNodes);
	});
}
export function GetSelectedNodePath(mapViewOrMapID: number | MapView): string {
	return GetSelectedNodePathNodes(mapViewOrMapID).join("/");
}
export function GetSelectedNodeID(mapID: number): number {
	return GetSelectedNodePathNodes(mapID).LastOrX().replace("L", "").ToInt();
}

export function GetPathFromDataPath(dataPathUnderRootNodeViews: string[]): string[] {
	let result = [];
	for (let [index, prop] of dataPathUnderRootNodeViews.entries()) {
		if (index == 0) { // first one is the root-node-id
			result.push(prop);
		} else if (prop == "children") {
			result.push(dataPathUnderRootNodeViews[index + 1]);
		}
	}
	return result;
}

export function GetFocusedNodePathNodes(mapViewOrMapID: number | MapView): string[] {
	let mapView = IsNumber(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];
	
	return CachedTransform("GetFocusedNodePathNodes", [], {rootNodeViews: mapView.rootNodeViews}, ()=> {
		let focusedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a=>a.prop == "focused" && a.Value);
		if (focusedTreeNode == null) return [];

		let focusedNodeView = focusedTreeNode.ancestorNodes.Last();
		//return focusedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
		return GetPathFromDataPath(focusedNodeView.PathNodes);
	});
}
export function GetFocusedNodePath(mapViewOrMapID: number | MapView): string {
	return GetFocusedNodePathNodes(mapViewOrMapID).join("/").toString(); // toString() needed if only 1 item
}
export function GetFocusedNodeID(mapID: number): number {
	let focusedNodeStr = GetFocusedNodePathNodes(mapID).LastOrX();
	return focusedNodeStr ? focusedNodeStr.replace("L", "").ToInt() : null;
}

export function GetMapView(mapID: number): MapView {
	return State("main", "mapViews", mapID);
}
export function GetNodeViewDataPath(mapID: number, path: string): string[] {
	let pathNodes = GetPathNodes(path);
	// this has better perf than the simpler approaches
	//let childPath = pathNodeIDs.map(childID=>`${childID}/children`).join("/").slice(0, -"/children".length);
	let childPathNodes = pathNodes.SelectMany(nodeStr=>["children", nodeStr]).slice(1);
	return ["main", "mapViews", mapID+"", "rootNodeViews", ...childPathNodes];
}
export function GetNodeView(mapID: number, path: string): MapNodeView {
	let dataPath = GetNodeViewDataPath(mapID, path);
	return State(...dataPath) as any;
}
export function GetViewOffset(mapView: MapView): Vector2i {
	if (mapView == null) return null;
	let treeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a=>a.prop == "viewOffset" && a.Value);
	return treeNode ? treeNode.Value : null;
}