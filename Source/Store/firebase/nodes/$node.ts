import { CachedTransform, VURL, GetValues } from "js-vextensions";
import { GetNodeRevision } from "../nodeRevisions";
import { GetNode, GetNodeID, GetParentNode, GetParentNodeL2, HolderType, IsLinkValid, IsNewLinkValid } from "../nodes";
import { PermissionGroupSet } from '../userExtras/@UserExtraInfo';
import { ChildEntry, ClaimForm, MapNode, MapNodeL2, MapNodeL3, Polarity } from "./@MapNode";
import { MapNodeRevision } from "./@MapNodeRevision";
import { MapNodeType } from './@MapNodeType';
import { SplitStringBySlash_Cached } from "Utils/Database/StringSplitCache";
import { SlicePath } from "Utils/Database/DatabaseHelpers";

export function GetFontSizeForNode(node: MapNodeL2, isSubnode = false) {
	if (node.current.fontSizeOverride) return node.current.fontSizeOverride;
	if (isSubnode) return 11;
	return 14;
}
export function GetPaddingForNode(node: MapNodeL2, isSubnode = false) {
	return isSubnode ? "1px 4px 2px" : "5px 5px 4px";
}

export function ReversePolarity(polarity: Polarity) {
	return polarity == Polarity.Supporting ? Polarity.Opposing : Polarity.Supporting;
}
export function GetFinalPolarityAtPath(node: MapNodeL2, path: string): Polarity {
	Assert(node.type == MapNodeType.Argument, "Only argument nodes have polarity.");
	let parent = GetParentNodeL2(path);
	if (!parent) return Polarity.Supporting; // can be null, if for NodeUI_ForBots

	let link = GetLinkUnderParent(node._id, parent);
	if (link == null) return Polarity.Supporting; // can be null, if path is invalid (eg. copied-node path)

	let parentForm = GetNodeForm(parent, SplitStringBySlash_Cached(path).slice(0, -1).join("/"));
	return GetFinalPolarity(link.polarity, parentForm);
}
export function GetFinalPolarity(basePolarity: Polarity, parentForm: ClaimForm): Polarity {
	let result = basePolarity;
	if (parentForm == ClaimForm.Negation) {
		result = ReversePolarity(result);
	}
	return result;
}
export function IsNodeL1(node): node is MapNode {
	return !node["current"];
}
export function AsNodeL1(node: MapNodeL2 | MapNodeL3) {
	let result = {...node};
	delete result.current;
	delete result["finalPolarity"];
	delete result["link"];
	return result as MapNode;
}

export function IsNodeL2(node: MapNode): node is MapNodeL2 {
	return node["current"];
}
export function AsNodeL2(node: MapNode, currentRevision: MapNodeRevision) {
	//Assert(currentRevision.titles, "A MapNodeRevision object must have a titles property!"); // temp removed (for db-upgrade)
	let result = node.Extended({current: currentRevision}) as MapNodeL2;
	delete result["finalPolarity"];
	delete result["link"];
	return result;
}
export function GetNodeL2(nodeID: number | MapNode, path?: string) {
	if (IsNumber(nodeID)) nodeID = GetNode(nodeID);
	if (nodeID == null) return null;
	let node = nodeID as MapNode;
	
	// if any of the data in a MapNodeL2 is not loaded yet, just return null (we want it to be all or nothing)
	let currentRevision = GetNodeRevision(node.currentRevision);
	if (currentRevision == null) return null;

	let nodeL2 = AsNodeL2(node, currentRevision);
	return CachedTransform("GetNodeL2", [path], nodeL2, ()=>nodeL2);
}

export function IsNodeL3(node: MapNode): node is MapNodeL2 {
	return node["finalPolarity"] && node["link"];
}
export function AsNodeL3(node: MapNodeL2, finalPolarity?: Polarity, link?: ChildEntry) {
	finalPolarity = finalPolarity || Polarity.Supporting;
	link = link || {
		_: true,
		form: ClaimForm.Base,
		seriesAnchor: false,
		polarity: Polarity.Supporting,
	};
	return node.Extended({finalPolarity, link}) as MapNodeL3;
}
export function GetNodeL3(path: string) {
	if (path == null) return null;
	let nodeID = GetNodeID(path);
	let node = GetNodeL2(nodeID);
	if (node == null) return null;
	
	// if any of the data in a MapNodeL3 is not loaded yet, just return null (we want it to be all or nothing)
	let finalPolarity = null;
	if (node.type == MapNodeType.Argument) {
		finalPolarity = GetFinalPolarityAtPath(node, path);
		if (finalPolarity == null) return null;
	}

	let parent = GetParentNode(path);
	if (parent == null && path.Contains("/")) return null;
	var link = GetLinkUnderParent(node._id, parent);
	if (link == null && path.Contains("/")) return null;

	let nodeL3 = AsNodeL3(node, finalPolarity, link);
	return CachedTransform("GetNodeL3", [path], nodeL3, ()=>nodeL3);
}

/*export function GetNodeForm(node: MapNode, path: string): ClaimForm {
	let parent = GetParentNode(path);
	return GetNodeForm(node, parent);
}
export function GetClaimFormUnderParent(node: MapNode, parent: MapNode): ClaimForm {
	let link = GetLinkUnderParent(node._id, parent);
	if (link == null) return ClaimForm.Base;
	return link.form;
}*/
export function GetNodeForm(node: MapNodeL2 | MapNodeL3, pathOrParent?: string | MapNodeL2) {
	if ((node as MapNodeL3).link) {
		return (node as MapNodeL3).link.form;
	}
	
	let parent: MapNodeL2 = IsString(pathOrParent) ? GetParentNodeL2(pathOrParent as string) : pathOrParent as MapNodeL2;
	let link = GetLinkUnderParent(node._id, parent);
	if (link == null) return ClaimForm.Base;
	return link.form;
}
export function GetLinkUnderParent(nodeID: number, parent: MapNode): ChildEntry {
	if (parent == null) return null;
	if (parent.children == null) return null; // post-delete, parent-data might have updated before child-data
	let link = parent.children[nodeID];
	return link;
}
export function GetLinkAtPath(path: string) {
	let nodeID = GetNodeID(path);
	let parent = GetNode(GetNodeID(SlicePath(path, 1)));
	return GetLinkUnderParent(nodeID, parent);
}

export function IsNodeTitleValid_GetError(node: MapNode, title: string) {
	if (title.trim().length == 0) return "Title cannot be empty.";
	return null;
}

/** Gets the main display-text for a node. (doesn't include equation explanation, quote sources, etc.) */
export function GetNodeDisplayText(node: MapNodeL2, path?: string, form?: ClaimForm): string {
	form = form || GetNodeForm(node, path);

	if (node.type == MapNodeType.Claim) {
		if (form) {
			if (form == ClaimForm.Negation)
				return node.current.titles.negation || "[negation title not set]";
			if (form == ClaimForm.YesNoQuestion)
				return node.current.titles.yesNoQuestion || "[yes-no-question title not set]";
			return node.current.titles.base || "[base title not set]";
		}
	}
	return node.current.titles.base || node.current.titles.yesNoQuestion || node.current.titles.negation || "";
}

export function GetValidChildTypes(nodeType: MapNodeType, path: string) {
	let nodeTypes = GetValues<MapNodeType>(MapNodeType);
	let validChildTypes = nodeTypes.filter(type=>IsLinkValid(nodeType, path, {type} as any));
	return validChildTypes;
}
export function GetValidNewChildTypes(parent: MapNodeL2, parentPath: string, holderType: HolderType, permissions: PermissionGroupSet) {
	let nodeTypes = GetValues<MapNodeType>(MapNodeType);
	let validChildTypes = nodeTypes.filter(type=>IsNewLinkValid(parentPath, holderType, {type} as any, permissions));
	return validChildTypes;
}

export function IsSinglePremiseArgument(node: MapNode) {
	return node && node.type == MapNodeType.Argument && !node.multiPremiseArgument;
}
export function IsMultiPremiseArgument(node: MapNode) {
	return node && node.type == MapNodeType.Argument && node.multiPremiseArgument;
}

export function IsPremiseOfSinglePremiseArgument(node: MapNode, parent: MapNode) {
	if (parent == null) return null;
	return node.type == MapNodeType.Claim && IsSinglePremiseArgument(parent);
}
export function IsPremiseOfMultiPremiseArgument(node: MapNode, parent: MapNode) {
	if (parent == null) return null;
	return node.type == MapNodeType.Claim && IsMultiPremiseArgument(parent);
}