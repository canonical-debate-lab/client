import {GetData} from "../../Utils/Database/DatabaseHelpers";
import {Map, MapType} from "./maps/@Map";
import {CachedTransform} from "js-vextensions";

export function GetMaps(): Map[] {
	let mapsMap = GetData("maps");
	return CachedTransform("GetMaps", [], mapsMap, ()=>mapsMap ? mapsMap.VValues(true) : []);
}
export function GetMap(id: number): Map {
	if (id == null) return null;
	return GetData("maps", id);
}
export function GetRootNodeID(mapID: number): number {
	let map = GetMap(mapID);
	if (map == null) return null;
	return map.rootNode;
}