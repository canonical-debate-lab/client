import { State } from 'Frame/Store/StoreHelpers';
import { GetMap } from 'Store/firebase/maps';
import { Action } from '../../Frame/General/Action';
import { CombineReducers } from '../../Frame/Store/ReducerUtils';
import { Map, MapType } from '../firebase/maps/@Map';

export class ACTPersonalMapSelect extends Action<{id: number}> {}
export class ACTPersonalMapSelect_WithData extends Action<{id: number, map: Map}> {}

export class Personal {
	// subpage: string;
	selectedMapID: number;
}

export const PersonalReducer = CombineReducers({
	// subpage: SubpageReducer("personal"),
	selectedMapID: (state = null, action) => {
		// if (action.Is(ACTPersonalMapSelect)) return action.payload.id;
		if (action.Is(ACTPersonalMapSelect_WithData) && (action.payload.map == null || action.payload.map.type == MapType.Personal)) return action.payload.id;
		return state;
	},
});

export function GetSelectedPersonalMapID() {
	return State(a => a.main.personal.selectedMapID);
}
export function GetSelectedPersonalMap() {
	const selectedID = GetSelectedPersonalMapID();
	return GetMap(selectedID);
}
