import { SimpleReducer } from 'Store';
import { CombineReducers } from '../../Frame/Store/ReducerUtils';

export class SearchStorage {
	queryStr: string;
	searchResults_partialTerms: string[];
	searchResults_nodeIDs: number[];
}

export const SearchReducer = CombineReducers({
	queryStr: SimpleReducer(a => a.main.search.queryStr),
	searchResults_partialTerms: SimpleReducer(a => a.main.search.searchResults_partialTerms, []),
	searchResults_nodeIDs: SimpleReducer(a => a.main.search.searchResults_nodeIDs, []),
});
