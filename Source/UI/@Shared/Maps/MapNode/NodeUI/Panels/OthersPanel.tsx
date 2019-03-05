import Moment from 'moment';
import { Button, CheckBox, Column, Div, Pre, Row, Select } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { GetParentNodeID, GetParentNodeL3 } from 'Store/firebase/nodes';
import { GetNodeViewers } from 'Store/firebase/nodeViewers';
import { GetUser, MeID, GetUserPermissionGroups } from 'Store/firebase/users';
import { Icon, InfoButton, SlicePath, Connect } from 'Utils/FrameworkOverrides';
import { GetEntries } from 'js-vextensions';
import {ES} from 'Utils/UI/GlobalStyles';
import { CanConvertFromClaimTypeXToY, ChangeClaimType } from '../../../../../../Server/Commands/ChangeClaimType';
import { ReverseArgumentPolarity } from '../../../../../../Server/Commands/ReverseArgumentPolarity';
import { UpdateLink } from '../../../../../../Server/Commands/UpdateLink';
import { UpdateNodeChildrenOrder } from '../../../../../../Server/Commands/UpdateNodeChildrenOrder';
import { Map } from '../../../../../../Store/firebase/maps/@Map';
import { GetClaimType, GetNodeDisplayText, GetNodeForm, GetNodeL3 } from '../../../../../../Store/firebase/nodes/$node';
import { ClaimForm, ClaimType, MapNodeL3 } from '../../../../../../Store/firebase/nodes/@MapNode';
import { ArgumentType } from '../../../../../../Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from '../../../../../../Store/firebase/nodes/@MapNodeType';
import { IsUserCreatorOrMod } from '../../../../../../Store/firebase/userExtras';
import { User } from '../../../../../../Store/firebase/users/@User';

const connector = (state, { node }: {map?: Map, node: MapNodeL3, path: string}) => ({
	_: GetUserPermissionGroups(MeID()),
	creator: GetUser(node.creator),
	viewers: GetNodeViewers(node._id),
});
@Connect(connector)
export class OthersPanel extends BaseComponentWithConnector(connector, { convertToType: null as ClaimType }) {
	render() {
		const { map, node, path, creator, viewers } = this.props;
		const mapID = map ? map._id : null;
		let { convertToType } = this.state;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), node);

		const parent = GetParentNodeL3(path);
		const parentPath = SlicePath(path, 1);
		const parentCreatorOrMod = IsUserCreatorOrMod(MeID(), parent);

		const nodeArgOrParentSPArg_controlled = (node.type == MapNodeType.Argument && creatorOrMod ? node : null)
			|| (parent && parent.type === MapNodeType.Argument && parentCreatorOrMod ? parent : null);
		const nodeArgOrParentSPArg_controlled_path = nodeArgOrParentSPArg_controlled && (nodeArgOrParentSPArg_controlled === node ? path : parentPath);

		const convertToTypes = GetEntries(ClaimType).filter(pair => CanConvertFromClaimTypeXToY(GetClaimType(node), pair.value));
		convertToType = convertToType || convertToTypes.map(a => a.value).FirstOrX();

		const isArgument_any = node.current.argumentType === ArgumentType.Any;

		return (
			<Column sel style={{ position: 'relative' }}>
				<InfoTable node={node} creator={creator}/>
				<Row>Parents: {node.parents == null ? 'none' : node.parents.VKeys(true).join(', ')}</Row>
				<Row>Children: {node.children == null ? 'none' : node.children.VKeys(true).join(', ')}</Row>
				<Row>Viewers: {viewers.length || '...'} <InfoButton text="The number of registered users who have had this node displayed in-map at some point."/></Row>
				{nodeArgOrParentSPArg_controlled
					&& <Row>
						<Button mt={3} text="Reverse argument polarity" onLeftClick={() => {
							ShowMessageBox({
								title: 'Reverse argument polarity?', cancelButton: true,
								// message: `Reverse polarity of argument "${GetNodeDisplayText(nodeArgOrParentSPArg_controlled)}"?\n\nAll relevance ratings will be deleted.`,
								message: `Reverse polarity of argument "${GetNodeDisplayText(nodeArgOrParentSPArg_controlled)}"?`,
								onOK: () => {
									new ReverseArgumentPolarity(E(mapID && { mapID }, { nodeID: nodeArgOrParentSPArg_controlled._id, path: nodeArgOrParentSPArg_controlled_path })).Run();
								},
							});
						}}/>
					</Row>}
				{node.type == MapNodeType.Claim && convertToTypes.length > 0
					&& <Row>
						<Pre>Convert to: </Pre>
						<Select options={convertToTypes} value={convertToType} onChange={val => this.SetState({ convertToType: val })}/>
						<Button ml={5} text="Convert" onClick={() => {
							new ChangeClaimType(E({ mapID }, { nodeID: node._id, newType: convertToType })).Run();
						}}/>
					</Row>}
				{node.type === MapNodeType.Argument && node.multiPremiseArgument && !isArgument_any
					&& <ChildrenOrder mapID={mapID} node={node}/>}
				<AtThisLocation node={node} path={path}/>
			</Column>
		);
	}
}

class InfoTable extends BaseComponent<{node: MapNodeL3, creator: User}, {}> {
	render() {
		const { node, creator } = this.props;
		return (
			<table className="selectableAC lighterBackground" style={{ marginBottom: 5 /* borderCollapse: "separate", borderSpacing: "10px 0" */}}>
				<thead>
					<tr><th>ID</th><th>Creator</th><th>Created at</th></tr>
				</thead>
				<tbody>
					<tr>
						<td>{node._id}</td>
						<td>{creator ? creator.displayName : 'n/a'}</td>
						<td>{Moment(node.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td>
					</tr>
				</tbody>
			</table>
		);
	}
}

class AtThisLocation extends BaseComponent<{node: MapNodeL3, path: string}, {}> {
	render() {
		const { node, path } = this.props;
		if (path.split('/').length === 0) return <div/>; // if the root of a map, or subnode

		let canSetAsNegation;
		let canSetAsSeriesAnchor;
		if (node.type == MapNodeType.Claim) {
			const claimType = GetClaimType(node);
			canSetAsNegation = claimType === ClaimType.Normal && node.link.form !== ClaimForm.YesNoQuestion;
			canSetAsSeriesAnchor = claimType === ClaimType.Equation && !node.current.equation.isStep; // && !creating;
		}

		return (
			<Column mt={10}>
				<Row style={{ fontWeight: 'bold' }}>At this location:</Row>
				<Row>Path: {path}</Row>
				{canSetAsNegation
					&& <Row style={{ display: 'flex', alignItems: 'center' }}>
						<Pre>Show as negation: </Pre>
						<CheckBox checked={node.link.form == ClaimForm.Negation}
							onChange={(val) => {
								new UpdateLink({
									linkParentID: GetParentNodeID(path), linkChildID: node._id,
									linkUpdates: { form: val ? ClaimForm.Negation : ClaimForm.Base },
								}).Run();
							}}/>
					</Row>}
				{canSetAsSeriesAnchor
					&& <Row style={{ display: 'flex', alignItems: 'center' }}>
						<Pre>Show as series anchor: </Pre>
						<CheckBox checked={node.link.seriesAnchor}
							// onChange={val=>Change(val ? newLinkData.isStep = true : delete newLinkData.isStep)}/>
							onChange={(val) => {
								new UpdateLink({
									linkParentID: GetParentNodeID(path), linkChildID: node._id,
									linkUpdates: { seriesAnchor: val || null },
								}).Run();
							}}/>
					</Row>}
			</Column>
		);
	}
}

class ChildrenOrder extends BaseComponent<{mapID: number, node: MapNodeL3}, {}> {
	render() {
		const { mapID, node } = this.props;
		const oldChildrenOrder = node.childrenOrder || [];
		const oldChildrenOrderValid = oldChildrenOrder.length == node.children.VKeys(true).length && oldChildrenOrder.every(id => node.children[id] != null);
		return (
			<Column mt={5}>
				<Row style={{ fontWeight: 'bold' }}>Children order:</Row>
				{oldChildrenOrder.map((childID, index) => {
					const childPath = (node._id ? `${node._id}/` : '') + childID;
					const child = GetNodeL3(childPath);
					const childTitle = child ? GetNodeDisplayText(child, childPath, GetNodeForm(child, node)) : '...';
					return (
						<Row key={index} style={{ alignItems: 'center' }}>
							<Div mr={7} sel style={{ opacity: 0.5 }}>#{childID}</Div>
							<Div sel style={ES({ flex: 1, whiteSpace: 'normal' })}>{childTitle}</Div>
							{/* <TextInput enabled={false} style={ES({flex: 1})} required pattern={MapNode_id}
								value={`#${childID.toString()}: ${childTitle}`}
								//onChange={val=>Change(!IsNaN(val.ToInt()) && (newData.childrenOrder[index] = val.ToInt()))}
							/> */}
							<Button text={<Icon size={16} icon="arrow-up"/> as any} m={2} ml={5} style={{ padding: 3 }} enabled={index > 0}
								onClick={() => {
									const newOrder = oldChildrenOrder.slice(0);
									newOrder.RemoveAt(index);
									newOrder.Insert(index - 1, childID);
									new UpdateNodeChildrenOrder({ mapID, nodeID: node._id, childrenOrder: newOrder }).Run();
								}}/>
							<Button text={<Icon size={16} icon="arrow-down"/> as any} m={2} ml={5} style={{ padding: 3 }} enabled={index < oldChildrenOrder.length - 1}
								onClick={() => {
									const newOrder = oldChildrenOrder.slice(0);
									newOrder.RemoveAt(index);
									newOrder.Insert(index + 1, childID);
									new UpdateNodeChildrenOrder({ mapID, nodeID: node._id, childrenOrder: newOrder }).Run();
								}}/>
						</Row>
					);
				})}
				{!oldChildrenOrderValid
					&& <Button mr="auto" text="Fix children-order" onClick={() => {
						const existingValidIDs = oldChildrenOrder.filter(id => node.children[id] != null);
						const missingChildIDs = node.children.Pairs(true).filter(pair => !oldChildrenOrder.Contains(pair.keyNum)).map(pair => pair.keyNum);
						new UpdateNodeChildrenOrder({ mapID, nodeID: node._id, childrenOrder: existingValidIDs.concat(missingChildIDs) }).Run();
					}}/>}
			</Column>
		);
	}
}
