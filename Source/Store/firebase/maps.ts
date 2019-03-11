import { CachedTransform } from 'js-vextensions';
import { GetData } from 'Utils/FrameworkOverrides';
import { Map, MapType } from './maps/@Map';

export function GetMaps(): Map[] {
	const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [], mapsMap, () => (mapsMap ? mapsMap.VValues(true) : []));
}
/* export function GetMapsOfType(type: MapType): Map[] {
	const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [type], mapsMap, () => (mapsMap ? mapsMap.VValues(true).filter(a => a && a.type == type) : []));
} */
export function GetMap(id: string): Map {
	if (id == null) return null;
	return GetData('maps', id);
}
export function GetRootNodeID(mapID: string): string {
	const map = GetMap(mapID);
	if (map == null) return null;
	return map.rootNode;
}

export function IsUserMap(map: Map) {
	return map.type == MapType.Personal || map.type == MapType.Debate;
}
