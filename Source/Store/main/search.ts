import { O } from 'vwebapp-framework';

export class SearchState {
	@O queryStr: string;
	@O searchResults_partialTerms = [] as string[];
	@O searchResults_nodeIDs = [] as string[];

	@O findNode_state = 'inactive' as 'inactive' | 'activating' | 'active';
	@O findNode_node: string;
	// @O findNode_type: 'FindContainingMaps' | 'FindInCurrentMap';
	@O findNode_resultPaths = [] as string[];
	@O findNode_currentSearchDepth = 0 as number;
}
