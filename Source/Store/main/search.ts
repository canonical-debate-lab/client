import { CombineReducers, SimpleReducer } from 'Utils/FrameworkOverrides';

export class SearchStorage {
	queryStr: string;
	searchResults_partialTerms: string[];
	searchResults_nodeIDs: string[];

	findNode_state: 'inactive' | 'activating' | 'active';
	findNode_node: string;
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
