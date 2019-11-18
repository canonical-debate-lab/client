import { string, model }Store_Old/firebase/mapsrs';
import { store, RootState } from 'Store';
import { StoreAccessor } from 'Utils/FrameworkOverrides';
import { GetMap } from 'Store/firebase/maps';

export class DebatesState {
	@string selectedMapID: string;
	// Why not using in-model views? Because it might change to need data from higher levels, which would require refactoring every time. Better to keep as standalone functions.
	// (also, means to find func you just type and intellisense-search finds it directly, which is arguably faster)
	/* get SelectedMap() {
		this.selectedMapID
	} */
}
export const DebatesStateM = model(DebatesState);

export const GetSelectedDebateMap = StoreAccessor((s) => () => {
	const selectedID = s.main.debates.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap.WS(s)(selectedID);
});
