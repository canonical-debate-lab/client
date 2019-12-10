import { O } from 'Utils/FrameworkOverrides';
import { store } from 'Store';
import { GetMap } from 'Store/firebase/maps';
import { StoreAccessor } from 'mobx-firelink';

export class PersonalState {
	@O selectedMapID: string;
}

export const GetSelectedPersonalMap = StoreAccessor((s) => () => {
	const selectedID = store.main.debates.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
