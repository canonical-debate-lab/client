import { Action, CombineReducers, State, SimpleReducer, StoreAccessor, O } from 'Utils/FrameworkOverrides';
import { GetUsers } from 'Store/firebase/users';
import { GetImages } from '../../Store/firebase/images';
import { GetTerms } from '../../Store/firebase/terms';
import { SubpageReducer } from './@Shared/$subpage';

export class Database {
	@O subpage: string;
	@O selectedUserID: string;
	@O selectedTermID: string;
	// @O selectedTermComponentID: string;
	@O selectedImageID: string;
}

export const GetSelectedUserID = StoreAccessor((s) => () => {
	return s.main.database.selectedUserID;
});
export const GetSelectedUser = StoreAccessor((s) => () => {
	const selectedID = GetSelectedUserID.WS(s)();
	return (GetUsers.WS(s)() || []).find((a) => a && a._key == selectedID);
});

export const GetSelectedTermID = StoreAccessor((s) => () => {
	return s.main.database.selectedTermID;
});
export const GetSelectedTerm = StoreAccessor((s) => () => {
	const selectedID = GetSelectedTermID.WS(s)();
	// return GetData(`terms/${selectedID}`);
	return (GetTerms.WS(s)() || []).find((a) => a && a._key == selectedID);
});
/* export function GetSelectedTermComponent() {
	let selectedID = State().main.selectedTermComponent;
	return GetTermComponent(selectedID);
} */

export const GetSelectedImageID = StoreAccessor((s) => () => {
	return s.main.database.selectedImageID;
});
export const GetSelectedImage = StoreAccessor((s) => () => {
	const selectedID = GetSelectedImageID.WS(s)();
	// return GetData(`terms/${selectedID}`);
	return (GetImages.WS(s)() || []).find((a) => a && a._key == selectedID);
});
