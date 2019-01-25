import { SimpleReducer } from 'Frame/Store/StoreHelpers';
import { CombineReducers } from '../../Frame/Store/ReducerUtils';

export class SearchStorage {
	queryStr: string;
	searchResults_partialTerms: string[];
	searchResults_nodeIDs: number[];

	findNode_state: 'inactive' | 'activating' | 'active';
	findNode_node: number;
	findNode_resultPaths: string[];
	findNode_currentSearchDepth: number;
}

export const SearchReducer = CombineReducers({
	queryStr: SimpleReducer(a => a.main.search.queryStr),
	searchResults_partialTerms: SimpleReducer(a => a.main.search.searchResults_partialTerms, []),
	searchResults_nodeIDs: SimpleReducer(a => a.main.search.searchResults_nodeIDs, []),

	findNode_state: SimpleReducer(a => a.main.search.findNode_state, 'inactive'),
	findNode_node: SimpleReducer(a => a.main.search.findNode_node),
	findNode_resultPaths: SimpleReducer(a => a.main.search.findNode_resultPaths, []),
	findNode_currentSearchDepth: SimpleReducer(a => a.main.search.findNode_currentSearchDepth, 0),
});
