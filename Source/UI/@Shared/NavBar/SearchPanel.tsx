import { CollectionReference, Query } from '@firebase/firestore-types';
import { SleepAsync, Vector2i, ToInt } from 'js-vextensions';
import keycode from 'keycode';
import Moment from 'moment';
import { Button, Column, Pre, Row, TextInput } from 'react-vcomponents';
import { BaseComponentWithConnector, FindReact } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { GetSearchTerms_Advanced } from 'Server/Commands/AddNodeRevision';
import { GetRootNodeID } from 'Store/firebase/maps';
import { GetNodeRevision } from 'Store/firebase/nodeRevisions';
import { AsNodeL3, GetAllNodeRevisionTitles, GetNodeDisplayText, GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetNodeColor, MapNodeType_Info } from 'Store/firebase/nodes/@MapNodeType';
import { GetUser } from 'Store/firebase/users';
import { GetOpenMapID } from 'Store/main';
import { ACTMapViewMerge } from 'Store/main/mapViews/$mapView';
import { MapNodeView, MapView } from 'Store/main/mapViews/@MapViews';
import { State, Connect, ACTSet, DBPath, GetAsync, ActionSet, InfoButton } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { NodeUI_Menu_Stub } from '../Maps/MapNode/NodeUI_Menu';
import { MapUI } from '../Maps/MapUI';

const columnWidths = [0.68, 0.2, 0.12];

const connector = (state, {}: {}) => {
	const searchResults_partialTerms = State(a => a.main.search.searchResults_partialTerms);
	const searchResultIDs = State(a => a.main.search.searchResults_nodeIDs);

	let results_nodeRevisions = searchResultIDs.map(revisionID => GetNodeRevision(revisionID));
	if (searchResults_partialTerms.length) {
		for (const term of searchResults_partialTerms) {
			results_nodeRevisions = results_nodeRevisions.filter(a => GetAllNodeRevisionTitles(a).find(a => a.toLowerCase().includes(term)));
		}
	}

	const results_nodeIDs = results_nodeRevisions.map(a => a && a.node).Distinct();
	return {
		queryStr: State(a => a.main.search.queryStr),
		results_nodeIDs,
	};
};
@Connect(connector)
export class SearchPanel extends BaseComponentWithConnector(connector, {}) {
	async PerformSearch() {
		let { queryStr } = this.props;
		const unrestricted = queryStr.endsWith(' /unrestricted');
		if (unrestricted) {
			queryStr = queryStr.slice(0, -' /unrestricted'.length);
		}

		const searchTerms = GetSearchTerms_Advanced(queryStr);
		if (searchTerms.wholeTerms.length == 0 && !unrestricted) {
			store.dispatch(new ACTSet(a => a.main.search.searchResults_partialTerms, []));
			store.dispatch(new ACTSet(a => a.main.search.searchResults_nodeIDs, []));
			return;
		}

		let query = firestoreDB.collection(DBPath('nodeRevisions')) as CollectionReference | Query;
		for (const term of searchTerms.wholeTerms) {
			query = query.where(`titles.allTerms.${term}`, '==', true);
		}

		const { docs } = await query.get();
		const docIDs = docs.map(a => a.id);
		store.dispatch(new ACTSet(a => a.main.search.searchResults_partialTerms, searchTerms.partialTerms));
		store.dispatch(new ACTSet(a => a.main.search.searchResults_nodeIDs, docIDs));
	}

	render() {
		const { queryStr, results_nodeIDs } = this.props;
		return (
			<Column style={{ width: 750, padding: 5, background: 'rgba(0,0,0,.7)', borderRadius: '0 0 0 5px' }}>
				<Row>
					<TextInput style={{ flex: 1 }} value={queryStr}
						onChange={(val) => {
							store.dispatch(new ACTSet(a => a.main.search.queryStr, val));
						}}
						onKeyDown={(e) => {
							if (e.keyCode == keycode.codes.enter) {
								this.PerformSearch();
							}
						}}/>
					<InfoButton ml={5} text="Wildcards can be used, but there must be at least one non-wildcard term. Example: climate chang*"/>
					<Button ml={5} text="Search" onClick={() => this.PerformSearch()}/>
				</Row>
				{/* <Row style={{ fontSize: 18 }}>Search results ({results_nodeIDs.length})</Row> */}
				<Column mt={5} className="clickThrough" style={{ height: 40, background: 'rgba(0,0,0,.7)', borderRadius: 10 }}>
					{/* <Row style={{ height: 40, padding: 10 }}>
						<Pre>Sort by: </Pre>
						<Select options={GetEntries(SortType, name => EnumNameToDisplayName(name))}
							value={sortBy} onChange={val => store.dispatch(new ACTMapNodeListSortBySet({ mapID: map._id, sortBy: val }))}/>
						<Row width={200} style={{ position: 'absolute', left: 'calc(50% - 100px)' }}>
							<Button text={<Icon icon="arrow-left" size={15}/>} title="Previous page"
								enabled={page > 0} onClick={() => {
									// store.dispatch(new ACTMapNodeListPageSet({mapID: map._id, page: page - 1}));
									store.dispatch(new ACTMapNodeListPageSet({ mapID: map._id, page: page - 1 }));
								}}/>
							<Div ml={10} mr={7}>Page: </Div>
							<TextInput mr={10} pattern="[0-9]+" style={{ width: 30 }} value={page + 1}
								onChange={(val) => {
									if (!IsNumberString(val)) return;
									store.dispatch(new ACTMapNodeListPageSet({ mapID: map._id, page: (parseInt(val) - 1).KeepBetween(0, lastPage) }));
								}}/>
							<Button text={<Icon icon="arrow-right" size={15}/>} title="Next page"
								enabled={page < lastPage} onClick={() => {
									store.dispatch(new ACTMapNodeListPageSet({ mapID: map._id, page: page + 1 }));
								}}/>
							</Row>
					</Row> */}
					<Row style={{ height: 40, padding: 10 }}>
						<span style={{ flex: columnWidths[0], fontWeight: 500, fontSize: 17 }}>Title</span>
						<span style={{ flex: columnWidths[1], fontWeight: 500, fontSize: 17 }}>Creator</span>
						<span style={{ flex: columnWidths[2], fontWeight: 500, fontSize: 17 }}>Creation date</span>
					</Row>
				</Column>
				<ScrollView style={ES({ flex: 1 })} contentStyle={{ paddingTop: 10 }} onContextMenu={(e) => {
					if (e.nativeEvent['passThrough']) return true;
					e.preventDefault();
				}}>
					{results_nodeIDs.filter(a => a).length == 0 && 'No search results.'}
					{results_nodeIDs.map((nodeID, index) => {
						return (
							<SearchResultRow key={nodeID} nodeID={nodeID} index={index}/>
						);
					})}
				</ScrollView>
			</Column>
		);
	}
}

const SearchResultRow_connector = (state, { nodeID }: {nodeID: string, index: number}) => {
	const node = GetNodeL2(nodeID);
	return {
		node,
		creator: node ? GetUser(node.creator) : null,

		mapID: GetOpenMapID(),
		rootNodeID: GetRootNodeID(GetOpenMapID()),

		findNode_state: State(a => a.main.search.findNode_state),
		findNode_node: State(a => a.main.search.findNode_node),
		findNode_resultPaths: State(a => a.main.search.findNode_resultPaths),
		findNode_currentSearchDepth: State(a => a.main.search.findNode_currentSearchDepth),
	};
};
@Connect(SearchResultRow_connector)
export class SearchResultRow extends BaseComponentWithConnector(SearchResultRow_connector, {}) {
	ComponentWillReceiveProps(props) {
		const { nodeID, rootNodeID, findNode_state, findNode_node } = props;
		if (findNode_node === nodeID) {
			if (findNode_state === 'activating') {
				store.dispatch(new ACTSet(a => a.main.search.findNode_state, 'active'));
				this.StartFindingPathsFromXToY(rootNodeID, nodeID);
			}
		}
	}
	async StartFindingPathsFromXToY(rootNodeX: number, targetNodeY: number) {
		const searchDepth = 100;

		const upPathCompletions = [];
		let upPathAttempts = [`${targetNodeY}`];
		for (let depth = 0; depth < searchDepth; depth++) {
			const newUpPathAttempts = [];
			for (const upPath of upPathAttempts) {
				const nodeID = upPath.split('/').Last();
				const node = await GetAsync(() => GetNodeL2(nodeID));
				if (node == null) {
					LogWarning(`Could not find node #${nodeID}, as parent of #${upPath.split('/').XFromLast(1)}.`);
					continue;
				}

				for (const parentID of (node.parents || {}).Pairs(true).map(a => a.keyNum)) {
					const newUpPath = `${upPath}/${parentID}`;
					if (parentID === rootNodeX) {
						upPathCompletions.push(newUpPath.split('/').Reversed().join('/'));
					} else {
						newUpPathAttempts.push(newUpPath);
					}
				}
			}
			upPathAttempts = newUpPathAttempts;

			// if (depth === 0 || upPathCompletions.length !== State(a => a.main.search.findNode_resultPaths).length) {
			store.dispatch(new ActionSet(
				new ACTSet(a => a.main.search.findNode_resultPaths, upPathCompletions.slice()),
				new ACTSet(a => a.main.search.findNode_currentSearchDepth, depth + 1),
			));

			await SleepAsync(100);
			// if we have no more up-path-attempts to follow, or comp gets unmounted, start stopping search
			if (upPathAttempts.length == 0 || this.mounted === false) this.StopSearch();
			// if search is marked as "starting to stop", actually stop search here by breaking the loop
			if (State(a => a.main.search.findNode_state) === 'inactive') break;
		}

		this.StopSearch();
	}
	StopSearch() {
		store.dispatch(new ACTSet(a => a.main.search.findNode_state, 'inactive'));
	}

	render() {
		const { nodeID, index, node, creator, mapID, findNode_state, findNode_node, findNode_resultPaths, findNode_currentSearchDepth } = this.props;
		// if (node == null) return <Row>Loading... (#{nodeID})</Row>;
		if (node == null) return <Row></Row>;

		const nodeL3 = AsNodeL3(node);
		const path = `${node._key}`;

		const backgroundColor = GetNodeColor(nodeL3).desaturate(0.5).alpha(0.8);
		const nodeTypeInfo = MapNodeType_Info.for[node.type];

		return (
			<Column>
				<Row mt={index === 0 ? 0 : 5} className="cursorSet"
					style={E(
						{ padding: 5, background: backgroundColor.css(), borderRadius: 5, cursor: 'pointer', border: '1px solid rgba(0,0,0,.5)' },
						// selected && { background: backgroundColor.brighten(0.3).alpha(1).css() },
					)}
					onMouseDown={(e) => {
						if (e.button !== 2) return false;
						this.SetState({ menuOpened: true });
					}}>
					<span style={{ flex: columnWidths[0] }}>{GetNodeDisplayText(node, path)}</span>
					<span style={{ flex: columnWidths[1] }}>{creator ? creator.displayName : '...'}</span>
					<span style={{ flex: columnWidths[2] }}>{Moment(node.createdAt).format('YYYY-MM-DD')}</span>
					{/* <NodeUI_Menu_Helper {...{map, node}}/> */}
					<NodeUI_Menu_Stub {...{ node: nodeL3, path: `${node._key}`, inList: true }}/>
				</Row>
				{findNode_node === nodeID &&
					<Row>
						{findNode_state === 'active' && <Pre>Finding in map... (depth: {findNode_currentSearchDepth})</Pre>}
						{findNode_state === 'inactive' && <Pre>Locations found in map: (depth: {findNode_currentSearchDepth})</Pre>}
						<Button ml={5} text="Stop" enabled={findNode_state === 'active'} onClick={() => this.StopSearch()}/>
						<Button ml={5} text="Close" onClick={() => {
							store.dispatch(new ActionSet(
								new ACTSet(a => a.main.search.findNode_state, 'inactive'),
								new ACTSet(a => a.main.search.findNode_node, null),
								new ACTSet(a => a.main.search.findNode_resultPaths, []),
								new ACTSet(a => a.main.search.findNode_currentSearchDepth, 0),
							));
						}}/>
					</Row>}
				{findNode_node === nodeID && findNode_resultPaths.length > 0
					&& findNode_resultPaths.map((resultPath) => {
						return (
							<Row key={resultPath}>
								<Button mr="auto" text={`Jump to ${resultPath}`} onClick={() => {
									JumpToNode(mapID, resultPath);
								}}/>
							</Row>
						);
					})}
			</Column>
		);
	}
}

export function JumpToNode(mapID: string, path: string) {
	const pathNodeIDs = path.split('/');

	const mapView = new MapView();
	const rootNodeView = new MapNodeView();
	mapView.rootNodeViews[pathNodeIDs[0]] = rootNodeView;

	let currentParentView = rootNodeView;
	for (const childID of pathNodeIDs.Skip(1)) {
		currentParentView.expanded = true;

		const childView = new MapNodeView();
		currentParentView.children[childID] = childView;
		currentParentView = childView;
	}
	currentParentView.focused = true;
	currentParentView.viewOffset = new Vector2i(0, 0);

	store.dispatch(new ACTMapViewMerge({ mapID, mapView }));

	const mapUI = FindReact(document.querySelector('.MapUI')) as MapUI;
	if (mapUI) {
		mapUI.StartLoadingScroll();
	}
}
