import {combineReducers} from "redux";

export class RootState {
}
export function MakeRootReducer(extraReducers?) {
	return combineReducers({
		// add reducers here
	});
}