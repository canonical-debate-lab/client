export type UserMapInfoSet = {maps: {[key: string]: UserMapInfo}};

export class UserMapInfo {
	_key: string;
	layerStates: LayerStatesMap;
}
export type LayerStatesMap = {[key: number]: boolean};
