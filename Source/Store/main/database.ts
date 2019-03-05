import { Action, CombineReducers, State, SimpleReducer } from 'Utils/FrameworkOverrides';
import { GetUsers } from 'Store/firebase/users';
import { GetImages } from '../firebase/images';
import { GetTerms } from '../firebase/terms';
import { SubpageReducer } from './@Shared/$subpage';

export class ACTUserSelect extends Action<{id: string}> {}
export class ACTTermSelect extends Action<{id: number}> {}
export class ACTImageSelect extends Action<{id: number}> {}

export class Database {
	subpage: string;
	selectedUserID: string;
	selectedTermID: number;
	// selectedTermComponentID: number;
	selectedImageID: number;
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
	return State(a => a.main.database.selectedUserID);
}
export function GetSelectedUser() {
	const selectedID = GetSelectedUserID();
	return (GetUsers() || []).find(a => a._key == selectedID);
}

export function GetSelectedTermID() {
	return State(a => a.main.database.selectedTermID);
}
export function GetSelectedTerm() {
	const selectedID = GetSelectedTermID();
	// return GetData(`terms/${selectedID}`);
	return (GetTerms() || []).find(a => a._id == selectedID);
}
/* export function GetSelectedTermComponent() {
	let selectedID = State().main.selectedTermComponent;
	return GetTermComponent(selectedID);
} */

export function GetSelectedImageID() {
	return State(a => a.main.database.selectedImageID);
}
export function GetSelectedImage() {
	const selectedID = GetSelectedImageID();
	// return GetData(`terms/${selectedID}`);
	return (GetImages() || []).find(a => a._id == selectedID);
}
