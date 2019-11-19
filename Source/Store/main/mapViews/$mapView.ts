import { Vector2i, Assert, IsString, GetTreeNodesInObjTree, DeepGet } from 'js-vextensions';
import { observable } from 'mobx';
import { O, SplitStringBySlash_Cached, Validate, StoreAccessor } from 'Utils/FrameworkOverrides';
import { UUID } from 'Utils/General/KeyGenerator';

export class MapView {
	// rootNodeView = new MapNodeView();
	// include root-node-view as a keyed-child, so that it's consistent with descendants (of key signifying id)
	// rootNodeView;
	@O rootNodeViews = observable.map<string, MapNodeView>();

	// if bot
	@O bot_currentNodeID?: number;
}

export class MapNodeView {
	// constructor(childLimit?: number) {
	// constructor(childLimit: number) {
	/* constructor() {
		this.childLimit = State(a=>a.main.initialChildLimit);
	} */

	@O expanded?: boolean;
	/* expanded_truth?: boolean;
	expanded_relevance?: boolean; */
	@O expanded_truth? = true;
	@O expanded_relevance? = true;
	@O selected?: boolean;
	@O focused?: boolean;
	/** Offset of view-center from self (since we're the focus-node). */
	@O viewOffset?: Vector2i;
	@O openPanel?: string;
	@O openTermID?: string;

	@O children? = observable.map<string, MapNodeView>();
	@O childLimit_up?: number;
	@O childLimit_down?: number;
}
export const emptyNodeView = new MapNodeView();

export type MapNodeView_SelfOnly = Omit<MapNodeView, 'children'>;
export const MapNodeView_SelfOnly_props = ['expanded', 'expanded_truth', 'expanded_relevance', 'selected', 'focused', 'viewOffset', 'openPanel', 'openTermID', 'childLimit_up', 'childLimit_down'];

export function GetPathNodes(path: string) {
	const pathSegments = SplitStringBySlash_Cached(path);
	Assert(pathSegments.every((a) => Validate('UUID', a) == null || a[0] == '*'), `Path contains non-uuid, non-*-prefixed segments: ${path}`);
	// return pathSegments.map(ToInt);
	return pathSegments;
}
export function PathSegmentToNodeID(segment: string): UUID {
	if (segment.length == 22) return segment;
	if (segment.length == 23) return segment.slice(1);
	Assert(false, 'Segment text is invalid.');
}
export function GetPathNodeIDs(path: string): UUID[] {
	const nodes = GetPathNodes(path);
	return nodes.map((a) => PathSegmentToNodeID(a));
}

export const GetSelectedNodePathNodes = StoreAccessor((s) => (mapViewOrMapID: string | MapView) => {
	const mapView = IsString(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	const selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX((a) => a.prop == 'selected' && a.Value);
	if (selectedTreeNode == null) return [];

	const selectedNodeView = selectedTreeNode.ancestorNodes.Last();
	// return selectedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
	return GetPathFromDataPath(selectedNodeView.PathNodes);
});
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

export const GetFocusedNodePathNodes = StoreAccessor((s) => (mapViewOrMapID: string | MapView): string[] => {
	const mapView = IsString(mapViewOrMapID) ? GetMapView(mapViewOrMapID) : mapViewOrMapID;
	if (mapView == null) return [];

	const focusedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX((a) => a.prop == 'focused' && a.Value);
	if (focusedTreeNode == null) return [];

	const focusedNodeView = focusedTreeNode.ancestorNodes.Last();
	// return focusedNodeView.PathNodes.filter(a=>a != "children").map(ToInt);
	return GetPathFromDataPath(focusedNodeView.PathNodes);
});
export const GetFocusedNodePath = StoreAccessor((s) => (mapViewOrMapID: string | MapView) => {
	return GetFocusedNodePathNodes(mapViewOrMapID).join('/').toString(); // toString() needed if only 1 item
});
export const GetFocusedNodeID = StoreAccessor((s) => (mapID: string) => {
	const focusedNodeStr = GetFocusedNodePathNodes(mapID).LastOrX();
	return focusedNodeStr ? PathSegmentToNodeID(focusedNodeStr) : null;
});

export const GetMapView = StoreAccessor((s) => (mapID: string) => {
	return s.main.mapViews.get(mapID);
});
export function GetNodeViewDataPath(mapID: string, path: string): string[] {
	const pathNodes = GetPathNodes(path);
	// this has better perf than the simpler approaches
	// let childPath = pathNodeIDs.map(childID=>`${childID}/children`).join("/").slice(0, -"/children".length);
	const childPathNodes = pathNodes.SelectMany((nodeStr) => ['children', nodeStr]).slice(1);
	return ['main', 'mapViews', `${mapID}`, 'rootNodeViews', ...childPathNodes];
}
export const GetNodeView = StoreAccessor((s) => (mapID: string, path: string): MapNodeView => {
	if (path == null) return null;
	const dataPath = GetNodeViewDataPath(mapID, path);
	return DeepGet(s, dataPath) as any;
});
export const GetNodeView_SelfOnly = StoreAccessor((s) => (mapID: string, path: string, returnEmptyNodeViewIfNull = false) => {
	/* const nodeView = GetNodeView(mapID, path);
	if (nodeView == null && returnEmptyNodeViewIfNull) return emptyNodeView; */

	// access each prop separately, so that changes to the "children" prop do not trigger this sub-watcher to re-run
	if (path == null) return null;
	const dataPath = GetNodeViewDataPath(mapID, path);
	const nodeView = {};
	for (const prop of MapNodeView_SelfOnly_props) {
		nodeView[prop] = DeepGet(s, dataPath.concat([prop]));
	}

	if (nodeView.VKeys().length == 0 && returnEmptyNodeViewIfNull) return emptyNodeView;
	return nodeView.Excluding('children') as MapNodeView_SelfOnly;
});
export const GetViewOffset = StoreAccessor((s) => (mapView: MapView): Vector2i => {
	if (mapView == null) return null;
	const treeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX((a) => a.prop == 'viewOffset' && a.Value);
	return treeNode ? treeNode.Value : null;
});
