import { CachedTransform_WithStore } from "Frame/Database/DatabaseHelpers";
import { SplitStringBySlash_Cached } from "Frame/Database/StringSplitCache";
import { emptyArray } from "Frame/Store/ReducerUtils";
import { CachedTransform, IsNaN } from "js-vextensions";
import { GetData, GetDataAsync, SlicePath } from "../../Frame/Database/DatabaseHelpers";
import { GetNodeL2, GetNodeL3 } from "./nodes/$node";
import { MapNode, MapNodeL2, MapNodeL3, globalRootNodeID } from "./nodes/@MapNode";
import { MapNodeType, MapNodeType_Info } from "./nodes/@MapNodeType";
import { IsUserCreatorOrMod } from "./userExtras";
import { HasAdminPermissions, HasModPermissions, PermissionGroupSet } from "./userExtras/@UserExtraInfo";
import { GetUserAccessLevel, GetUserID } from "./users";

export enum HolderType {
	Truth = 10,
	Relevance = 20,
}

export type NodeMap = {[key: string]: MapNode};
export function GetNodeMap(queries?): NodeMap {
	return GetData({queries}, "nodes");
}
export function GetNodes(queries?): MapNode[] {
	let nodeMap = GetNodeMap(queries);
	return CachedTransform("GetNodes", [ToJSON(queries)], nodeMap, ()=>nodeMap ? nodeMap.VValues(true) : []);
}
export function GetNodesL2(queries?): MapNodeL2[] {
	let nodes = GetNodes(queries);
	return CachedTransform("GetNodes", [ToJSON(queries)], nodes, ()=>nodes.map(a=>GetNodeL2(a)));
}
/*export function GetNodes_Enhanced(): MapNode[] {
	let nodeMap = GetNodeMap();
	return CachedTransform("GetNodes_Enhanced", [], nodeMap, ()=>nodeMap ? nodeMap.VValues(true) : []);
}*/

export function GetNode(id: number) {
	//Assert(id != null && !IsNaN(id), "Node-id cannot be null or NaN.");
	if (id == null || IsNaN(id)) return null;
	return GetData("nodes", id) as MapNode;
}
/*export async function GetNodeAsync(id: number) {
	return await GetDataAsync("nodes", id) as MapNode;
}*/

export function GetParentCount(node: MapNode) {
	return (node.parents || {}).VKeys(true).length;
}
export function GetChildCount(node: MapNode) {
	return (node.children || {}).VKeys(true).length;
}

export function IsRootNode(node: MapNode) {
	if (IsNodeSubnode(node)) return false;
	return node.type == MapNodeType.Category && GetParentCount(node) == 0;
}
export function IsNodeSubnode(node: MapNode) {
	return node.layerPlusAnchorParents != null;
}

export function GetParentNodeID(path: string) {
	let pathNodes = SplitStringBySlash_Cached(path);
	if (pathNodes.Last()[0] == "L") return null;
	let parentNodeStr = pathNodes.XFromLast(1);
	return parentNodeStr ? parentNodeStr.replace("L", "").ToInt() : null;
}
export function GetParentNode(childPath: string) {
	return GetNode(GetParentNodeID(childPath));
}
export function GetParentNodeL2(childPath: string) {
	return GetNodeL2(GetParentNodeID(childPath));
}
export function GetParentNodeL3(childPath: string) {
	return GetNodeL3(childPath.split("/").slice(0, -1).join("/"));
}
export function GetNodeID(path: string) {
	let ownNodeStr = SplitStringBySlash_Cached(path).LastOrX();
	return ownNodeStr ? ownNodeStr.replace("L", "").ToInt() : null;
}

export function GetNodeParents(node: MapNode) {
	let parents = (node.parents || {}).VKeys(true).map(id=>GetNode(parseInt(id)));
	return CachedTransform("GetNodeParents", [node._id], parents, ()=>parents);
}
export async function GetNodeParentsAsync(node: MapNode) {
	return await Promise.all(node.parents.VKeys(true).map(parentID=>GetDataAsync("nodes", parentID))) as MapNode[];
}
export function GetNodeParentsL2(node: MapNode) {
	let parentsL2 = GetNodeParents(node).map(parent=>parent ? GetNodeL2(parent) : null);
	return CachedTransform("GetNodeParentsL2", [], parentsL2, ()=>parentsL2);
}
export function GetNodeParentsL3(node: MapNode, path: string) {
	let parentsL3 = GetNodeParents(node).map(parent=>parent ? GetNodeL3(SlicePath(path, 1)) : null);
	return CachedTransform("GetNodeParentsL3", [path], parentsL3, ()=>parentsL3);
}

/*export function GetNodeChildIDs(nodeID: number) {
	let node = GetNode(nodeID);
	// any time the childIDs changes, we know the node object changes as well; so just cache childIDs on node
	if (node["@childIDs"] == null)
		node.VSet("@childIDs", (node.children || {}).VKeys(true).map(id=>parseInt(id)), {prop: {}});
	return node["@childIDs"];
}*/
export function GetNodeChildren(node: MapNode) {
	// special case, for demo map
	if (node.children && node.children[0] instanceof MapNode) {
		return node.children as any as MapNode[];
	}

	let children = (node.children || {}).VKeys(true).map(id=>GetNode(parseInt(id)));
	return CachedTransform("GetNodeChildren", [node._id], children, ()=>children);
}
export async function GetNodeChildrenAsync(node: MapNode) {
	return await Promise.all(node.children.VKeys(true).map(id=>GetDataAsync("nodes", id))) as MapNode[];
}

export function GetNodeChildrenL2(node: MapNode) {
	let nodeChildren = GetNodeChildren(node);
	let nodeChildrenL2 = nodeChildren.map(child=>child ? GetNodeL2(child) : null);
	return CachedTransform("GetNodeChildrenL2", [], nodeChildrenL2, ()=>nodeChildrenL2);
}
export function GetNodeChildrenL3(node: MapNode, path?: string, filterForPath = false): MapNodeL3[] {
	if (node == null) return emptyArray;
	return CachedTransform_WithStore("GetNodeChildrenL3", [node._id, path, filterForPath], node.children, ()=> {
		path = path || node._id+"";
		
		let nodeChildrenL2 = GetNodeChildrenL2(node);
		let nodeChildrenL3 = nodeChildrenL2.map(child=>child ? GetNodeL3(path + "/" + child._id) : null);
		if (filterForPath) {
			nodeChildrenL3 = nodeChildrenL3.filter(child=> {
				// if null, keep (so receiver knows there's an entry here, but it's still loading)
				if (child == null) return true;
				// filter out any nodes whose access-level is higher than our own
				if (child.current.accessLevel > GetUserAccessLevel(GetUserID())) return false;
				// hide nodes that don't have the required premise-count
				//if (!IsNodeVisibleToNonModNonCreators(child, GetNodeChildren(child)) && !IsUserCreatorOrMod(GetUserID(), child)) return false;
				return true;
			});
		}
		return nodeChildrenL3;
	});
}

export function GetHolderType(child: MapNode, parent: MapNode) {
	if (child && child.type == MapNodeType.Argument) {
		return parent.type == MapNodeType.Argument ? HolderType.Relevance : HolderType.Truth;
	}
	return null;
}

export function IsLinkValid(parentType: MapNodeType, parentPath: string, child: MapNode) {
	let parentTypeInfo = MapNodeType_Info.for[parentType].childTypes;
	if (!parentTypeInfo.Contains(child.type)) return false;
	return true;
}
export function IsNewLinkValid(parentPath: string, newHolderType: HolderType, newChild: MapNode, permissions: PermissionGroupSet) {
	let parent = GetNode(GetNodeID(parentPath));
	let parentPathIDs = SplitStringBySlash_Cached(parentPath).map(a=>a.ToInt());
	//if (map.name == "Global" && parentPathIDs.length == 1) return false; // if parent is l1(root), don't accept new children
	if (parent._id == globalRootNodeID && !HasAdminPermissions(permissions)) return false; // if parent is global-root, don't accept new children (unless admin)
	// if in global map, parent is l2, and user is not a mod (and not node creator), don't accept new children
	if (parentPathIDs[0] == globalRootNodeID && parentPathIDs.length == 2 && !HasModPermissions(permissions) && parent.creator != GetUserID()) return false;
	if (parent._id == newChild._id) return false; // cannot link node as its own child

	let isAlreadyChild = (parent.children || {}).VKeys(true).Contains(newChild._id+"");
	let currentHolderType = GetHolderType(newChild, parent);
	if (isAlreadyChild && currentHolderType == newHolderType) return false; // if already a child of this parent, reject (unless it's a claim, in which case allow, as can be)
	return IsLinkValid(parent.type, parentPath, newChild);
}

export function ForUnlink_GetError(userID: string, node: MapNodeL2, asPartOfCut = false) {
	let baseText = `Cannot unlink node #${node._id}, since `;
	if (!IsUserCreatorOrMod(userID, node)) return `${baseText}you are not its owner. (or a mod)`;
	if (!asPartOfCut && (node.parents || {}).VKeys(true).length <= 1)  return `${baseText}doing so would orphan it. Try deleting it instead.`;
	if (IsRootNode(node)) return `${baseText}it's the root-node of a map.`;
	if (IsNodeSubnode(node)) return `${baseText}it's a subnode. Try deleting it instead.`;
	return null;
}
export function ForDelete_GetError(userID: string, node: MapNodeL2, subcommandInfo?: {asPartOfMapDelete?: boolean, childrenBeingDeleted?: number[]}) {
	let baseText = `Cannot delete node #${node._id}, since `;
	if (!IsUserCreatorOrMod(userID, node)) return `${baseText}you are not the owner of this node. (or a mod)`;
	if (GetParentCount(node) > 1) return `${baseText}it has more than one parent. Try unlinking it instead.`;
	if (IsRootNode(node) && !AsObj(subcommandInfo).asPartOfMapDelete) return `${baseText}it's the root-node of a map.`;

	let nodeChildren = GetNodeChildrenL2(node);
	if (nodeChildren.Any(a=>a == null)) return "[still loading children...]";
	if (nodeChildren.map(a=>a._id).Except(AsObj(subcommandInfo).childrenBeingDeleted || []).length) {
		return `Cannot delete this node (#${node._id}) until all its children have been unlinked or deleted.`;
	}
	return null;
}

export function ForCut_GetError(userID: string, node: MapNodeL2) {
	return ForUnlink_GetError(userID, node, true);
}

export function ForCopy_GetError(userID: string, node: MapNode) {
	if (IsRootNode(node)) return `Cannot copy the root-node of a map.`;
	if (IsNodeSubnode(node)) return `Cannot copy a subnode.`;
	return null;
}

/*export function GetUnlinkErrorMessage(parent: MapNode, child: MapNode) {
	//let childNodes = node.children.Select(a=>nodes[a]);
	let parentNodes = nodes.filter(a=>a.children && a.children[node._id]);
	if (parentNodes.length <= 1)
}*/