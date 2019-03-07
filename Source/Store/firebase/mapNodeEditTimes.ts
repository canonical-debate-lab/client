import { GetShortestPathFromRootToNode } from 'Utils/Store/PathFinder';
import { GetNode } from 'Store/firebase/nodes';
import { emptyArray } from 'js-vextensions';
import { GetData, CachedTransform_WithStore, AddSchema } from 'Utils/FrameworkOverrides';
import { GetLastAcknowledgementTime } from '../main';
import { GetRootNodeID } from './maps';
import { MapNode } from './nodes/@MapNode';

export class NodeEditTimes {
	// [key: number]: ChangeInfo;
	[key: number]: number;
}
AddSchema({
	patternProperties: { '^[0-9]+$': { type: 'number' } },
}, 'NodeEditTimes');

export enum ChangeType {
	Add = 10,
	Edit = 20,
	Remove = 30,
}
/* export class ChangeInfo {
	type: ChangeType;
	time: number;
} */

const colorMap = {
	[ChangeType.Add]: '0,255,0',
	// [ChangeType.Edit]: "255,255,0",
	[ChangeType.Edit]: '255,255,0',
	[ChangeType.Remove]: '255,0,0',
};
export function GetChangeTypeOutlineColor(changeType: ChangeType) {
	if (changeType == null) return null;
	return colorMap[changeType];
}

export function GetMapNodeEditTimes(mapID: number) {
	return GetData('mapNodeEditTimes', mapID) as NodeEditTimes;
}

export function GetNodeIDsChangedSinceX(mapID: number, sinceTime: number, includeAcknowledgement = true) {
	const nodeEditTimes = GetMapNodeEditTimes(mapID);
	if (nodeEditTimes == null) return emptyArray;

	const result = [] as number[];
	for (const { name: nodeIDStr, value: editTime } of nodeEditTimes.Props(true)) {
		const nodeID = nodeIDStr.ToInt();
		const lastAcknowledgementTime = includeAcknowledgement ? GetLastAcknowledgementTime(nodeID) : 0;
		const sinceTimeForNode = sinceTime.KeepAtLeast(lastAcknowledgementTime);
		if (editTime > sinceTimeForNode) {
			result.push(nodeID);
		}
	}
	return result;
}
export function GetPathsToNodesChangedSinceX(mapID: number, time: number, includeAcknowledgement = true) {
	return CachedTransform_WithStore('GetPathsToNodesChangedSinceX', [mapID, time, includeAcknowledgement], {}, () => {
		const nodeIDs = GetNodeIDsChangedSinceX(mapID, time, includeAcknowledgement);
		const mapRootNodeID = GetRootNodeID(mapID);
		if (mapRootNodeID == null) return emptyArray;

		const result = [] as string[];
		for (const nodeID of nodeIDs) {
			const node = GetNode(nodeID);
			if (node == null) return emptyArray;
			const pathToRoot = GetShortestPathFromRootToNode(mapRootNodeID, node);
			if (pathToRoot == null) return emptyArray;
			result.push(pathToRoot);
		}
		return result;
	});
}
export function GetNodeChangeType(node: MapNode, sinceTime: number, includeAcknowledgement = true) {
	const lastAcknowledgementTime = includeAcknowledgement ? GetLastAcknowledgementTime(node._id) : 0;
	const sinceTimeForNode = sinceTime.KeepAtLeast(lastAcknowledgementTime);
	if (node.createdAt >= sinceTimeForNode) return ChangeType.Add;
	return ChangeType.Edit;
}
