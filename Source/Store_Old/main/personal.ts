import { GetMap } from 'Store_Old/firebase/maps';
import { Action, CombineReducers, State, StoreAccessor } from '../../Utils/FrameworkOverrides';
import { Map, MapType } from '../firebase/maps/@Map';

export class ACTPersonalMapSelect extends Action<{id: string}> {}
export class ACTPersonalMapSelect_WithData extends Action<{id: string, map: Map}> {}

export class Personal {
	// subpage: string;
	selectedMapID: string;
}

export const PersonalReducer = CombineReducers({
	// subpage: SubpageReducer("personal"),
	selectedMapID: (state = null, action) => {
		// if (action.Is(ACTPersonalMapSelect)) return action.payload.id;
		if (action.Is(ACTPersonalMapSelect_WithData) && (action.payload.map == null || action.payload.map.type == MapType.Personal)) return action.payload.id;
		return state;
	},
});

export const GetSelectedPersonalMapID = StoreAccessor(() => {
	return State((a) => a.main.personal.selectedMapID);
});
export const GetSelectedPersonalMap = StoreAccessor(() => {
	const selectedID = GetSelectedPersonalMapID();
	// if (selectedID == '---TestingMap---') return GetTestingMap();
	return GetMap(selectedID);
});
