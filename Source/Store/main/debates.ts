import { GetMapsOfType, GetMap } from 'Store/firebase/maps';
import { VURL } from 'js-vextensions';
import {GetImages} from "../firebase/images";
import {GetTerms} from "../firebase/terms";
import { Action } from "../../Frame/General/Action";
import {CombineReducers} from "../../Frame/Store/ReducerUtils";
import {MapType, Map} from "../firebase/maps/@Map";
import { IsNumber } from 'js-vextensions';
import SubpageReducer from './@Shared/$subpage';
import { State } from 'Frame/Store/StoreHelpers';

export class ACTDebateMapSelect extends Action<{id: number}> {}
export class ACTDebateMapSelect_WithData extends Action<{id: number, map: Map}> {}

export class Debates {
	// subpage: string;
	selectedMapID: number;
}

export const DebatesReducer = CombineReducers({
	// subpage: SubpageReducer("debates"),
	selectedMapID: (state = null, action) => {
		// if (action.Is(ACTDebateMapSelect)) return action.payload.id;
		if (action.Is(ACTDebateMapSelect_WithData) && (action.payload.map == null || action.payload.map.type == MapType.Debate)) return action.payload.id;
		/* if (action.type == LOCATION_CHANGED) {
			let id = parseInt(VURL.FromLocationObject(action.payload).pathNodes[1]);
			if (IsNumber(id)) return id;
		} */
		return state;
	},
});

export function GetSelectedDebateMapID() {
	return State(a => a.main.debates.selectedMapID);
}
export function GetSelectedDebateMap() {
	const selectedID = GetSelectedDebateMapID();
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
}
