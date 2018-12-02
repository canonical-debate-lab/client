import { SimpleReducer } from 'Store';
import { CombineReducers } from '../../Frame/Store/ReducerUtils';

export class SearchStorage {
	queryStr: string;
	searchResultIDs: number[];
}

export const SearchReducer = CombineReducers({
	queryStr: SimpleReducer(a => a.main.search.queryStr),
	searchResultIDs: SimpleReducer(a => a.main.search.searchResultIDs, []),
});
