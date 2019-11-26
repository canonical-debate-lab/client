import { CachedTransform, emptyArray_forLoading, ToNumber } from 'js-vextensions';
import { StoreAccessor } from 'Utils/FrameworkOverrides';
import { Map, MapType } from './maps/@Map';
import {GetDocs, GetDoc} from 'Utils/LibIntegrations/MobXFirelink';

export const GetMaps = StoreAccessor((s) => (orderByEdits = false): Map[] => {
	/* const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [], mapsMap, () => (mapsMap ? mapsMap.VValues(true) : [])); */
	const mapsMap = GetDocs(a=>a.maps);
	if (!mapsMap) return emptyArray_forLoading;
	let result = mapsMap.VValues(true);
	if (orderByEdits) result = result.OrderByDescending((a) => ToNumber(a && a.edits, 0));
	return result;
});
export const GetMaps_Personal = StoreAccessor((s) => (orderByEdits = false) => {
	return GetMaps(orderByEdits).filter((a) => a && a.type == MapType.Personal);
});
export const GetMaps_Debate = StoreAccessor((s) => (orderByEdits = false) => {
	return GetMaps(orderByEdits).filter((a) => a && a.type == MapType.Debate);
});

/* export function GetMapsOfType(type: MapType): Map[] {
	const mapsMap = GetData({ collection: true }, 'maps');
	return CachedTransform('GetMaps', [type], mapsMap, () => (mapsMap ? mapsMap.VValues(true).filter(a => a && a.type == type) : []));
} */
export const GetMap = StoreAccessor((s) => (id: string): Map => {
	return GetDoc(a=>a.maps.get(id));
});
export const GetRootNodeID = StoreAccessor((s) => (mapID: string): string => {
	const map = GetMap(mapID);
	if (map == null) return null;
	return map.rootNode;
});

export function IsUserMap(map: Map) {
	return map.type == MapType.Personal || map.type == MapType.Debate;
}
