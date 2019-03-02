import { Vector2i } from 'js-vextensions';
import { GetNode } from 'Store/firebase/nodes';
import {CachedTransform_WithStore} from 'Utils/FrameworkOverrides';
import { MapNode } from '../../Store/firebase/nodes/@MapNode';
import { GetPathNodes } from '../../Store/main/mapViews';
import { MapNodeView, MapView } from '../../Store/main/mapViews/@MapViews';

// todo: probably merge this function with the StartFindingPathsFromXToY function in SearchPanel.tsx
export function GetShortestPathFromRootToNode(rootNodeID: number, node: MapNode): string {
	return CachedTransform_WithStore('GetShortestPathFromRootToNode', [rootNodeID, node._id], {}, () => {
		GetNode(node._id); // call this so cache system knows to recalculate when node-data changes

		type Head = {id: number, path: number[]};
		let currentLayerHeads: Head[] = (node.parents || {}).VKeys(true).map(id => ({ id: parseInt(id), path: [parseInt(id), node._id] }));
		while (currentLayerHeads.length) {
			// first, quickly check if any current-layer-head parents are the root-node (and if so, return right away, as we found a shortest path)
			for (const layerHead of currentLayerHeads) {
				if (layerHead.id == rootNodeID) {
					return layerHead.path.join('/');
				}
			}

			// else, find new-layer-heads for next search loop
			const newLayerHeads = [];
			for (const layerHead of currentLayerHeads) {
				const node = GetNode(layerHead.id);
				if (node == null) return null;
				for (const parentID of (node.parents || {}).VKeys(true).map(id => parseInt(id))) {
					if (layerHead.path.Contains(parentID)) continue; // parent-id is already part of path; ignore, so we don't cause infinite-loop
					newLayerHeads.push({ id: parentID, path: [parentID].concat(layerHead.path) });
				}
			}
			currentLayerHeads = newLayerHeads;
		}
		return null;
	});
}

export function CreateMapViewForPath(path: string): MapView {
	const pathNodes = GetPathNodes(path);
	const result = new MapView();
	result.rootNodeViews[pathNodes[0]] = CreateNodeViewForPath(pathNodes.Skip(1));
	return result;
}
export function CreateNodeViewForPath(pathFromSelfToDescendent: string[]): MapNodeView {
	const result = new MapNodeView();
	result.expanded = true;

	if (pathFromSelfToDescendent.length) {
		// Assert(IsNumber(pathFromSelfToDescendent[0]), "pathFromSelfToDescendent must contain only numbers.");
		const nextNodeStr = pathFromSelfToDescendent[0];
		const childNodeView = CreateNodeViewForPath(pathFromSelfToDescendent.Skip(1));
		result.children[nextNodeStr] = childNodeView;
	} else {
		result.selected = true;
		result.focused = true;
		result.viewOffset = new Vector2i(200, 0);
	}

	return result;
}
