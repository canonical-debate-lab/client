import { O } from 'vwebapp-framework';
import { store } from 'Store';
import { GetMap } from 'Store/firebase/maps';
import { StoreAccessor } from 'mobx-firelink';

export class PersonalState {
	@O selectedMapID: string;
}

export const GetSelectedPersonalMap = StoreAccessor((s) => () => {
	const selectedID = store.main.personal.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Personal) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
