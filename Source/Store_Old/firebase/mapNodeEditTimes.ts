import { GetShortestPathFromRootToNode } from 'Utils/Store/PathFinder';
import { GetNode, GetNodeID } from 'Store_Old/firebase/nodes';
import { emptyArray } from 'js-vextensions';
import { GetData, AddSchema, StoreAccessor, SubWatch } from 'Utils/FrameworkOverrides';
import { UUID_regex } from 'Utils/General/KeyGenerator';
import { GetLastAcknowledgementTime } from '../main';
import { GetRootNodeID } from './maps';
import { MapNode } from './nodes/@MapNode';

export class NodeEditTimes {
	// [key: number]: ChangeInfo;
	[key: string]: number;
}
AddSchema('NodeEditTimes', {
	patternProperties: { [UUID_regex]: { type: 'number' } },
});

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

export const GetMapNodeEditTimes = StoreAccessor((mapID: string) => {
	return GetData('mapNodeEditTimes', mapID) as NodeEditTimes;
});

export const GetNodeIDsChangedSinceX = StoreAccessor((mapID: string, sinceTime: number, includeAcknowledgement = true): string[] => {
	const nodeEditTimes = GetMapNodeEditTimes(mapID);
	if (nodeEditTimes == null) return emptyArray;

	const result = [] as string[];
	for (const { name: nodeID, value: editTime } of nodeEditTimes.Props(true)) {
		const lastAcknowledgementTime = includeAcknowledgement ? GetLastAcknowledgementTime(nodeID) : 0;
		const sinceTimeForNode = sinceTime.KeepAtLeast(lastAcknowledgementTime);
		if (editTime > sinceTimeForNode) {
			result.push(nodeID);
		}
	}
	return result;
});
export const GetPathsToNodesChangedSinceX = StoreAccessor((mapID: string, time: number, includeAcknowledgement = true) => {
	// return CachedTransform_WithStore('GetPathsToNodesChangedSinceX', [mapID, time, includeAcknowledgement], {}, () => {
	return SubWatch('GetPathsToNodesChangedSinceX', [mapID, time, includeAcknowledgement], (): string[] => {
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
});
/* export const GetPathsToNodesChangedSinceX = StoreAccessor((mapID: string, time: number, includeAcknowledgement = true) => {
	// return CachedTransform_WithStore('GetPathsToNodesChangedSinceX', [mapID, time, includeAcknowledgement], {}, () => {
	// return SubWatch('GetPathsToNodesChangedSinceX', [mapID, time, includeAcknowledgement], [], () => {
	const nodeIDs = GetNodeIDsChangedSinceX(mapID, time, includeAcknowledgement);
	const mapRootNodeID = GetRootNodeID(mapID);
	if (mapRootNodeID == null) return emptyArray;

	const result = [] as string[];
	for (const [index, nodeID] of nodeIDs.entries()) {
		const entry = SubWatch('GetPathsToNodesChangedSinceX_1', [mapID, time, includeAcknowledgement], [], () => {
			const node = GetNode(nodeID);
			if (node == null) return null;
			const pathToRoot = GetShortestPathFromRootToNode(mapRootNodeID, node);
			return pathToRoot;
		});
		if (entry == null) return emptyArray; // bail out if any are null
		result.push(entry);
	}
	return result;
}); */
export const GetPathsToChangedDescendantNodes_WithChangeTypes = StoreAccessor((mapID: string, sinceTime: number, path: string, includeAcknowledgement = true) => {
	const pathsToChangedNodes = GetPathsToNodesChangedSinceX(mapID, sinceTime, includeAcknowledgement);
	const pathsToChangedDescendantNodes = pathsToChangedNodes.filter((a) => a.startsWith(`${path}/`));
	// const changeTypesOfChangedDescendantNodes = pathsToChangedDescendantNodes.map(path => GetNodeChangeType.Watch(GetNode.Watch(GetNodeID(path)), sinceTime));
	const changeTypesOfChangedDescendantNodes = pathsToChangedDescendantNodes.map((path) => GetNodeChangeType(GetNode(GetNodeID(path)), sinceTime));
	return changeTypesOfChangedDescendantNodes;
});

export const GetNodeChangeType = StoreAccessor((node: MapNode, sinceTime: number, includeAcknowledgement = true) => {
	const lastAcknowledgementTime = includeAcknowledgement ? GetLastAcknowledgementTime(node._key) : 0;
	const sinceTimeForNode = sinceTime.KeepAtLeast(lastAcknowledgementTime);
	if (node.createdAt >= sinceTimeForNode) return ChangeType.Add;
	return ChangeType.Edit;
});
