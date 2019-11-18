import { Action, CombineReducers, State, SimpleReducer, StoreAccessor } from 'Utils/FrameworkOverrides';
import { GetUsers } from 'Store_Old/firebase/users';
import { GetImages } from '../firebase/images';
import { GetTerms } from '../firebase/terms';
import { SubpageReducer } from './@Shared/$subpage';

export class ACTUserSelect extends Action<{id: string}> {}
export class ACTTermSelect extends Action<{id: string}> {}
export class ACTImageSelect extends Action<{id: string}> {}

export class Database {
	subpage: string;
	selectedUserID: string;
	selectedTermID: string;
	// selectedTermComponentID: string;
	selectedImageID: string;
}

export const DatabaseReducer = CombineReducers({
	subpage: SubpageReducer('database'),
	selectedUserID: (state = null, action) => {
		if (action.Is(ACTUserSelect)) { return action.payload.id; }
		return state;
	},
	selectedTermID: (state = null, action) => {
		if (action.Is(ACTTermSelect)) { return action.payload.id; }
		return state;
	},
	/* selectedTermComponent: (state = null, action)=> {
		if (action.Is(ACTTermSelect))
			return action.payload.id;
		return state;
	}, */
	selectedImageID: (state = null, action) => {
		if (action.Is(ACTImageSelect)) { return action.payload.id; }
		return state;
	},
});

export function GetSelectedUserID() {
	return State((a) => a.main.database.selectedUserID);
}
export const GetSelectedUser = StoreAccessor(() => {
	const selectedID = GetSelectedUserID();
	return (GetUsers() || []).find((a) => a && a._key == selectedID);
});

export const GetSelectedTermID = StoreAccessor(() => {
	return State((a) => a.main.database.selectedTermID);
});
export const GetSelectedTerm = StoreAccessor(() => {
	const selectedID = GetSelectedTermID();
	// return GetData(`terms/${selectedID}`);
	return (GetTerms() || []).find((a) => a && a._key == selectedID);
});
/* export function GetSelectedTermComponent() {
	let selectedID = State().main.selectedTermComponent;
	return GetTermComponent(selectedID);
} */

export const GetSelectedImageID = StoreAccessor(() => {
	return State((a) => a.main.database.selectedImageID);
});
export const GetSelectedImage = StoreAccessor(() => {
	const selectedID = GetSelectedImageID();
	// return GetData(`terms/${selectedID}`);
	return (GetImages() || []).find((a) => a && a._key == selectedID);
});
