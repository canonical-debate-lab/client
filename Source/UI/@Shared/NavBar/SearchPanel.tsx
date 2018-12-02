import { CollectionReference, Query } from '@firebase/firestore-types';
import { DBPath } from 'Frame/Database/DatabaseHelpers';
import { Connect } from 'Frame/Database/FirebaseConnect';
import { Button, Column, Row, TextInput } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { GetSearchTerms } from 'Server/Commands/AddNodeRevision';
import { ACTSet } from 'Store';
import { GetNodeRevision } from 'Store/firebase/nodeRevisions';
import { GetNodeDisplayText, GetNodeL2 } from 'Store/firebase/nodes/$node';
import { MapNodeL2 } from 'Store/firebase/nodes/@MapNode';

const connector = (state, {}: {}) => {
	const searchResultIDs = State(a => a.main.search.searchResultIDs);
	const results_nodeRevisions = searchResultIDs.map(revisionID => GetNodeRevision(revisionID));
	const results_nodeIDs = results_nodeRevisions.map(a => a && a.node).Distinct();
	const results_nodes = results_nodeIDs.map(nodeID => GetNodeL2(nodeID));
	return {
		queryStr: State(a => a.main.search.queryStr),
		results_nodeIDs,
		results_nodes,
	};
};
@Connect(connector)
export class SearchPanel extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { queryStr, results_nodeIDs, results_nodes } = this.props;
		return (
			<Column style={{ width: 750, padding: 5, background: 'rgba(0,0,0,.7)', borderRadius: '0 0 0 5px' }}>
				<Row>
					<TextInput style={{ flex: 1 }} value={queryStr} onChange={(val) => {
						store.dispatch(new ACTSet(a => a.main.search.queryStr, val));
					}}/>
					<Button ml={5} text="Search" onClick={async () => {
						// const searchTerms = GetSearchTerms_Advanced(queryStr);
						const searchTerms = GetSearchTerms(queryStr);
						if (searchTerms.length == 0) {
							store.dispatch(new ACTSet(a => a.main.search.searchResultIDs, []));
							return;
						}

						let query = firestoreDB.collection(DBPath('nodeRevisions')) as CollectionReference | Query;
						for (const term of searchTerms) {
							query = query.where('titles.allTerms', 'array-contains', term);
						}

						const { docs } = await query.get();
						const docIDs = docs.map(a => a.id);
						store.dispatch(new ACTSet(a => a.main.search.searchResultIDs, docIDs));

						// todo: do local filtering for wildcard terms
					}}/>
				</Row>
				<Row style={{ fontSize: 18 }}>Search results ({results_nodeIDs.length})</Row>
				<Row>
					{results_nodeIDs.map((nodeID, index) => {
						return (
							<SearchResultRow key={nodeID} nodeID={nodeID} node={results_nodes[index]}/>
						);
					})}
				</Row>
			</Column>
		);
	}
}

export class SearchResultRow extends BaseComponent<{nodeID: number, node: MapNodeL2}, {}> {
	render() {
		const { nodeID, node } = this.props;
		if (node == null) return <Row>Loading... (#{nodeID})</Row>;

		return (
			<Row>
				ID: {node._id} Text: {GetNodeDisplayText(node)}
			</Row>
		);
	}
}
