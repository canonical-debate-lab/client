import { O } from 'vwebapp-framework';
import { GetMap } from 'Store/firebase/maps';
import { StoreAccessor } from 'mobx-firelink';

export class PublicPageState {
	@O selectedMapID: string;
	// Why not using in-model views? Because it might change to need data from higher levels, which would require refactoring every time. Better to keep as standalone functions.
	// (also, means to find func you just type and intellisense-search finds it directly, which is arguably faster)
	/* get SelectedMap() {
		this.selectedMapID
	} */
}

export const GetSelectedPublicMap = StoreAccessor((s) => () => {
	const selectedID = s.main.public.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
