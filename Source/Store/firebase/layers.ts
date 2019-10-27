import { CachedTransform, emptyArray, ToInt } from 'js-vextensions';
import { Layer } from 'Store/firebase/layers/@Layer';
import { GetNode } from 'Store/firebase/nodes';
import { GetData, StoreAccessor } from 'Utils/FrameworkOverrides';
import { Map } from './maps/@Map';
import { AsNodeL3, GetNodeL2 } from './nodes/$node';
import { GetUserLayerStatesForMap } from './userMapInfo';
import { MapNodeL3 } from './nodes/@MapNode';

export const GetLayers = StoreAccessor((): Layer[] => {
	const layersMap = GetData({ collection: true }, 'layers');
	return CachedTransform('GetLayers', [], layersMap, () => (layersMap ? layersMap.VValues(true) : []));
});
export function GetLayer(id: string): Layer {
	if (id == null) return null;
	return GetData('layers', id);
}

export function GetMapLayerIDs(map: Map) {
	return (map.layers || {}).VKeys(true);
}
export function GetMapLayers(map: Map) {
	const layers = GetMapLayerIDs(map).map(id => GetLayer(id));
	return CachedTransform('GetLayersForMap', [map._key], layers, () => layers);
}

export function GetSubnodeIDsInLayer(anchorNodeID: string, layerID: string) {
	return (GetData('layers', layerID, '.nodeSubnodes', `.${anchorNodeID}`) || {}).VKeys(true);
}
export function GetSubnodesInLayer(anchorNodeID: string, layerID: string) {
	const subnodeIDs = GetSubnodeIDsInLayer(anchorNodeID, layerID);
	const subnodes = subnodeIDs.map(id => GetNode(id));
	return CachedTransform('GetSubnodesInLayer', [anchorNodeID, layerID], subnodes, () => subnodes);
}
/* export function GetSubnodesInLayerEnhanced(anchorNodeID: string, layerID: string) {
	let subnodes = GetSubnodesInLayer(anchorNodeID, layerID);
	let subnodesEnhanced = subnodes.map(child=> {
		if (child == null) return null;
		return {...child, finalType: child.type, link: null};
	});
	return CachedTransform("GetSubnodesInLayerEnhanced", [anchorNodeID, layerID], subnodesEnhanced, ()=>subnodesEnhanced);
} */

export const GetSubnodesInEnabledLayersEnhanced = StoreAccessor((userID: string, map: Map, anchorNodeID: string): MapNodeL3[] => {
	const layersEnabled = GetMapLayers(map);
	// if some layers aren't loaded yet, return nothing
	if (layersEnabled.Any(a => a == null)) return emptyArray;

	const userLayerStates = GetUserLayerStatesForMap(userID, map._key) || {};
	for (const { name: layerID, value: state } of userLayerStates.Props(true)) {
		const existingEntry = layersEnabled.find(a => a._key == layerID);
		if (state == true) {
			if (existingEntry == null) {
				layersEnabled.push(GetLayer(layerID));
			}
		} else if (existingEntry != null) {
			layersEnabled.Remove(existingEntry);
		}
	}

	const subnodeIDs = [];
	for (const layer of layersEnabled) {
		subnodeIDs.AddRange(GetSubnodeIDsInLayer(anchorNodeID, layer._key));
	}
	const subnodesL3 = subnodeIDs.map((id) => {
		const child = GetNodeL2(id);
		if (child == null) return null;
		return AsNodeL3(child);
	});
	return CachedTransform('GetSubnodesInEnabledLayersEnhanced', [map._key, userID, anchorNodeID], subnodesL3, () => subnodesL3);
});

export const ForDeleteLayer_GetError = StoreAccessor((userID: string, layer: Layer) => {
	if ((layer.nodeSubnodes || {}).VKeys(true).length) return 'Cannot delete layer until all the subnodes within it are deleted.';
});
