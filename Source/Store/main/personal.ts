import { string, model }Store_Old/firebase/mapsrs';
import { StoreAccessor } from 'Utils/FrameworkOverrides';
import { store } from 'Store';
import { GetMap } from 'Store/firebase/maps';

export class PersonalState {
	@string selectedMapID: string;
}
export const PersonalStateM = model(PersonalState);

export const GetSelectedPersonalMap = StoreAccessor(() => {
	const selectedID = store.main.debates.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
