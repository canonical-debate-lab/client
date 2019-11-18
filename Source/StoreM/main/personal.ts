import { string, model } from 'mst-decorators';
import { StoreAccessor } from 'Utils/FrameworkOverrides';
import { rootState } from 'StoreM/StoreM';
import { GetMap } from 'Store/firebase/maps';

export class PersonalState {
	@string selectedMapID: string;
}
export const PersonalStateM = model(PersonalState);

export const GetSelectedPersonalMap = StoreAccessor(() => {
	const selectedID = rootState.main.debates.selectedMapID;
	// return GetData(`maps/${selectedID}`);
	// return (GetMapsOfType(MapType.Debate) || []).find(a=>a._id == selectedID);
	return GetMap(selectedID);
});
