import { GetMap } from 'Store_Old/firebase/maps';
import { Action, CombineReducers, State, StoreAccessor } from 'Utils/FrameworkOverrides';
import { Map, MapType } from '../firebase/maps/@Map';

export class ACTDebateMapSelect extends Action<{id: string}> {}
export class ACTDebateMapSelect_WithData extends Action<{id: string, map: Map}> {}

export class Debates {
	// subpage: string;
	selectedMapID: string;
}

export const DebatesReducer = CombineReducers({
	// subpage: SubpageReducer("debates"),
	selectedMapID: (state = null, action) => {
		// if (action.Is(ACTDebateMapSelect)) return action.payload.id;
		if (action.Is(ACTDebateMapSelect_WithData) && (action.payload.map == null || action.payload.map.type == MapType.Debate)) return action.payload.id;
		/* if (action.type == LOCATION_CHANGED) {
			let id = parseInt(VURL.FromLocationObject(action.payload.location).pathNodes[1]);
			if (IsNumber(id)) return id;
		} */
		return state;
	},
});

export function GetSelectedDebateMapID() {
	return State((a) => a.main.debates.selectedMapID);
}
export const GetSelectedDebateMap = StoreAccessor(() => {
	const selectedID = GetSelectedDebateMapID();
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
