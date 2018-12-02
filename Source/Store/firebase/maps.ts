import { CachedTransform } from 'js-vextensions';
import { GetData } from '../../Frame/Database/DatabaseHelpers';
import { Map, MapType } from './maps/@Map';

export function GetMaps(): Map[] {
	const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [], mapsMap, () => (mapsMap ? mapsMap.VValues(true) : []));
}
export function GetMapsOfType(type: MapType): Map[] {
	const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [type], mapsMap, () => (mapsMap ? mapsMap.VValues(true).filter(a => a.type == type) : []));
}
export function GetMap(id: number): Map {
	if (id == null) return null;
	// return GetData({ excludeCollections: ['nodeEditTimes'] }, 'maps', id);
	return GetData('maps', id);
}
export function GetRootNodeID(mapID: number): number {
	const map = GetMap(mapID);
	if (map == null) return null;
	return map.rootNode;
}

export function IsUserMap(map: Map) {
	return map.type == MapType.Personal || map.type == MapType.Debate;
}
