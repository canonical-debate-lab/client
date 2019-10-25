import { CachedTransform, IsNaN, emptyArray, ToJSON, AsObj } from 'js-vextensions';
import { GetData, SplitStringBySlash_Cached, SlicePath, GetDataAsync, CachedTransform_WithStore, StoreAccessor } from 'Utils/FrameworkOverrides';
import { PathSegmentToNodeID } from 'Store/main/mapViews';
import { GetNodeL2, GetNodeL3 } from './nodes/$node';
import { MapNode, MapNodeL2, MapNodeL3, globalRootNodeID } from './nodes/@MapNode';
import { MapNodeType, MapNodeType_Info } from './nodes/@MapNodeType';
import { IsUserCreatorOrMod, CanGetBasicPermissions, HasAdminPermissions } from './userExtras';
import { PermissionGroupSet } from './userExtras/@UserExtraInfo';
import { GetUserAccessLevel, MeID } from './users';

export enum HolderType {
	Truth = 10,
	Relevance = 20,
}

export type NodeMap = {[key: string]: MapNode};
export function GetNodeMap(): NodeMap {
	return GetData('nodes');
}
export function GetNodes(): MapNode[] {
	const nodeMap = GetNodeMap();
	return CachedTransform('GetNodes', [], nodeMap, () => (nodeMap ? nodeMap.VValues(true) : []));
}
export function GetNodesL2(): MapNodeL2[] {
	const nodes = GetNodes();
	return CachedTransform('GetNodes', [], nodes, () => nodes.map(a => GetNodeL2(a)));
}
/* export function GetNodes_Enhanced(): MapNode[] {
	let nodeMap = GetNodeMap();
	return CachedTransform("GetNodes_Enhanced", [], nodeMap, ()=>nodeMap ? nodeMap.VValues(true) : []);
} */

export const GetNode = StoreAccessor((id: string) => {
	// Assert(id != null && !IsNaN(id), "Node-id cannot be null or NaN.");
	if (id == null || IsNaN(id)) return null;
	return GetData('nodes', id) as MapNode;
});
/* export async function GetNodeAsync(id: string) {
	return await GetDataAsync("nodes", id) as MapNode;
} */

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

export function GetParentPath(childPath: string) {
	return SplitStringBySlash_Cached(childPath).slice(0, -1).join('/');
}
export function GetParentNodeID(path: string) {
	const pathNodes = SplitStringBySlash_Cached(path);
	if (pathNodes.Last()[0] == '*') return null;
	const parentNodeStr = pathNodes.XFromLast(1);
	return parentNodeStr ? PathSegmentToNodeID(parentNodeStr) : null;
}
export function GetParentNode(childPath: string) {
	return GetNode(GetParentNodeID(childPath));
}
export const GetParentNodeL2 = StoreAccessor((childPath: string) => {
	return GetNodeL2(GetParentNodeID(childPath));
});
export const GetParentNodeL3 = StoreAccessor((childPath: string) => {
	return GetNodeL3(GetParentPath(childPath));
});
export function GetNodeID(path: string) {
	const ownNodeStr = SplitStringBySlash_Cached(path).LastOrX();
	return ownNodeStr ? PathSegmentToNodeID(ownNodeStr) : null;
}

export function GetNodeParents(node: MapNode) {
	const parents = (node.parents || {}).VKeys(true).map(id => GetNode(id));
	return CachedTransform('GetNodeParents', [node._key], parents, () => parents);
}
export async function GetNodeParentsAsync(node: MapNode) {
	return await Promise.all(node.parents.VKeys(true).map(parentID => GetDataAsync('nodes', parentID))) as MapNode[];
}
export function GetNodeParentsL2(node: MapNode) {
	const parentsL2 = GetNodeParents(node).map(parent => (parent ? GetNodeL2(parent) : null));
	return CachedTransform('GetNodeParentsL2', [], parentsL2, () => parentsL2);
}
export function GetNodeParentsL3(node: MapNode, path: string) {
	const parentsL3 = GetNodeParents(node).map(parent => (parent ? GetNodeL3(SlicePath(path, 1)) : null));
	return CachedTransform('GetNodeParentsL3', [path], parentsL3, () => parentsL3);
}

/* export function GetNodeChildIDs(nodeID: string) {
	let node = GetNode(nodeID);
	// any time the childIDs changes, we know the node object changes as well; so just cache childIDs on node
	if (node["@childIDs"] == null)
		node.VSet("@childIDs", (node.children || {}).VKeys(true).map(id=>parseInt(id)), {prop: {}});
	return node["@childIDs"];
} */
export function GetNodeChildren(node: MapNode) {
	// special case, for demo map
	if (node.children && node.children[0] instanceof MapNode) {
		return node.children as any as MapNode[];
	}

	const children = (node.children || {}).VKeys(true).map(id => GetNode(id));
	return CachedTransform('GetNodeChildren', [node._key], children, () => children);
}
export async function GetNodeChildrenAsync(node: MapNode) {
	return await Promise.all(node.children.VKeys(true).map(id => GetDataAsync('nodes', id))) as MapNode[];
}

export function GetNodeChildrenL2(node: MapNode) {
	const nodeChildren = GetNodeChildren(node);
	const nodeChildrenL2 = nodeChildren.map(child => (child ? GetNodeL2(child) : null));
	return CachedTransform('GetNodeChildrenL2', [], nodeChildrenL2, () => nodeChildrenL2);
}
export const GetNodeChildrenL3 = StoreAccessor((node: MapNode, path?: string, filterForPath = false): MapNodeL3[] => {
	if (node == null) return emptyArray;
	// return CachedTransform_WithStore('GetNodeChildrenL3', [node._key, path, filterForPath], node.children, () => {
	path = path || `${node._key}`;

	const nodeChildrenL2 = GetNodeChildrenL2(node);
	let nodeChildrenL3 = nodeChildrenL2.map(child => (child ? GetNodeL3(`${path}/${child._key}`) : null));
	if (filterForPath) {
		nodeChildrenL3 = nodeChildrenL3.filter((child) => {
			// if null, keep (so receiver knows there's an entry here, but it's still loading)
			if (child == null) return true;
			// filter out any nodes whose access-level is higher than our own
			if (child.current.accessLevel > GetUserAccessLevel(MeID())) return false;
			// hide nodes that don't have the required premise-count
			// if (!IsNodeVisibleToNonModNonCreators(child, GetNodeChildren(child)) && !IsUserCreatorOrMod(MeID(), child)) return false;
			return true;
		});
	}
	return nodeChildrenL3;
	// });
});

export function GetHolderType(childType: MapNodeType, parentType: MapNodeType) {
	if (parentType == MapNodeType.Argument) {
		if (childType == MapNodeType.Argument) return HolderType.Relevance;
	} else if (parentType == MapNodeType.Claim) {
		if (childType == MapNodeType.Argument) return HolderType.Truth;
	}
	return null;
}

export function ForLink_GetError(parentType: MapNodeType, childType: MapNodeType) {
	const parentTypeInfo = MapNodeType_Info.for[parentType].childTypes;
	if (!parentTypeInfo.Contains(childType)) return `The child's type (${MapNodeType[childType]}) is not valid for the parent's type (${MapNodeType[parentType]}).`;
}
export function ForNewLink_GetError(parentID: string, newChild: Pick<MapNode, '_key' | 'type'>, permissions: PermissionGroupSet, newHolderType?: HolderType) {
	if (!CanGetBasicPermissions(permissions)) return "You're not signed in, or lack basic permissions.";
	const parent = GetNode(parentID);
	if (parent == null) return 'Parent data not found.';
	// const parentPathIDs = SplitStringBySlash_Cached(parentPath).map(a => a.ToInt());
	// if (map.name == "Global" && parentPathIDs.length == 1) return false; // if parent is l1(root), don't accept new children
	if (parent._key == globalRootNodeID && !HasAdminPermissions(permissions)) return 'Only admins can add children to the global-root.';
	// if in global map, parent is l2, and user is not a mod (and not node creator), don't accept new children
	// if (parentPathIDs[0] == globalRootNodeID && parentPathIDs.length == 2 && !HasModPermissions(permissions) && parent.creator != MeID()) return false;
	if (parent._key == newChild._key) return 'Cannot link node as its own child.';

	const isAlreadyChild = (parent.children || {}).VKeys(true).Contains(`${newChild._key}`);
	// if new-holder-type is not specified, consider "any" and so don't check
	if (newHolderType !== undefined) {
		const currentHolderType = GetHolderType(newChild.type, parent.type);
		if (isAlreadyChild && currentHolderType == newHolderType) return false; // if already a child of this parent, reject (unless it's a claim, in which case allow, as can be)
	}
	return ForLink_GetError(parent.type, newChild.type);
}

export function ForUnlink_GetError(userID: string, node: MapNodeL2, asPartOfCut = false) {
	const baseText = `Cannot unlink node #${node._key}, since `;
	if (!IsUserCreatorOrMod(userID, node)) return `${baseText}you are not its owner. (or a mod)`;
	if (!asPartOfCut && (node.parents || {}).VKeys(true).length <= 1) return `${baseText}doing so would orphan it. Try deleting it instead.`;
	if (IsRootNode(node)) return `${baseText}it's the root-node of a map.`;
	if (IsNodeSubnode(node)) return `${baseText}it's a subnode. Try deleting it instead.`;
	return null;
}
export function ForDelete_GetError(userID: string, node: MapNodeL2, subcommandInfo?: {asPartOfMapDelete?: boolean, childrenToIgnore?: string[]}) {
	const baseText = `Cannot delete node #${node._key}, since `;
	if (!IsUserCreatorOrMod(userID, node)) return `${baseText}you are not the owner of this node. (or a mod)`;
	if (GetParentCount(node) > 1) return `${baseText}it has more than one parent. Try unlinking it instead.`;
	if (IsRootNode(node) && !AsObj(subcommandInfo).asPartOfMapDelete) return `${baseText}it's the root-node of a map.`;

	const nodeChildren = GetNodeChildrenL2(node);
	if (nodeChildren.Any(a => a == null)) return '[still loading children...]';
	if (nodeChildren.map(a => a._key).Except(AsObj(subcommandInfo).childrenToIgnore || []).length) {
		return `Cannot delete this node (#${node._key}) until all its children have been unlinked or deleted.`;
	}
	return null;
}

export function ForCut_GetError(userID: string, node: MapNodeL2) {
	return ForUnlink_GetError(userID, node, true);
}

export function ForCopy_GetError(userID: string, node: MapNode) {
	if (!CanGetBasicPermissions(userID)) return "You're not signed in, or lack basic permissions.";
	if (IsRootNode(node)) return 'Cannot copy the root-node of a map.';
	if (IsNodeSubnode(node)) return 'Cannot copy a subnode.';
	return null;
}

/* export function GetUnlinkErrorMessage(parent: MapNode, child: MapNode) {
	//let childNodes = node.children.Select(a=>nodes[a]);
	let parentNodes = nodes.filter(a=>a.children && a.children[node._id]);
	if (parentNodes.length <= 1)
} */
