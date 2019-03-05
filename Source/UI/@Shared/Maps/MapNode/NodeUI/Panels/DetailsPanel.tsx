import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { SetNodeUILocked } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponent, GetInnerComp } from 'react-vextensions';
import { GetUpdates, RemoveHelpers, WaitTillPathDataIsReceived, DBPath, Connect } from 'Utils/FrameworkOverrides';
import { AddNodeRevision } from '../../../../../../Server/Commands/AddNodeRevision';
import { UpdateLink } from '../../../../../../Server/Commands/UpdateLink';
import { Map } from '../../../../../../Store/firebase/maps/@Map';
import { GetParentNode, GetParentNodeID, GetParentNodeL3, IsNodeSubnode } from '../../../../../../Store/firebase/nodes';
import { GetLinkUnderParent } from '../../../../../../Store/firebase/nodes/$node';
import { MapNodeL3 } from '../../../../../../Store/firebase/nodes/@MapNode';
import { IsUserCreatorOrMod } from '../../../../../../Store/firebase/userExtras';
import { GetUser, MeID, GetUserPermissionGroups } from '../../../../../../Store/firebase/users';
import { User } from '../../../../../../Store/firebase/users/@User';
import { NodeDetailsUI } from '../../NodeDetailsUI';

type DetailsPanel_Props = {map?: Map, node: MapNodeL3, path: string} & Partial<{creator: User}>;
@Connect((state, { node, path }: DetailsPanel_Props) => ({
	_: GetUserPermissionGroups(MeID()),
	_link: GetLinkUnderParent(node._id, GetParentNode(path)),
	creator: GetUser(node.creator),
}))
// export class DetailsPanel extends BaseComponent<DetailsPanel_Props, {error: Error}> {
export class DetailsPanel extends BaseComponent<DetailsPanel_Props, {dataError: string}> {
	detailsUI: NodeDetailsUI;
	render() {
		const { map, node, path, creator } = this.props;
		const mapID = map ? map._id : null;
		const { dataError } = this.state;

		const isSubnode = IsNodeSubnode(node);

		const parentNode = GetParentNodeL3(path);
		// if parent-node not loaded yet, don't render yet
		if (!isSubnode && path.includes('/') && parentNode == null) return null;

		const link = GetLinkUnderParent(node._id, parentNode);

		const creatorOrMod = IsUserCreatorOrMod(MeID(), node);
		return (
			<Column style={{ position: 'relative' }}>
				<NodeDetailsUI ref={c => this.detailsUI = c}
					baseData={node} baseRevisionData={node.current} baseLinkData={link} parent={parentNode}
					forNew={false} enabled={creatorOrMod}
					onChange={(newData, newLinkData) => {
						this.SetState({ dataError: this.detailsUI.GetValidationError() });
					}}/>
				{creatorOrMod
					&& <Row>
						<Button text="Save" enabled={dataError == null} onLeftClick={async () => {
							// let nodeUpdates = GetUpdates(node, this.detailsUI.GetNewData()).Excluding("parents", "children", "layerPlusAnchorParents", "finalType", "link");
							if (link) {
								const linkUpdates = GetUpdates(link, this.detailsUI.GetNewLinkData());
								if (linkUpdates.VKeys(true).length) {
									await new UpdateLink(E({ linkParentID: GetParentNodeID(path), linkChildID: node._id, linkUpdates })).Run();
								}
							}

							if (parentNode) SetNodeUILocked(parentNode._id, true);
							try {
								const revisionID = await new AddNodeRevision({ mapID: map._id, revision: RemoveHelpers(this.detailsUI.GetNewRevisionData()) }).Run();
								store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: node._id, time: Date.now() }));
								// await WaitTillPathDataIsReceiving(DBPath(`nodeRevisions/${revisionID}`));
								await WaitTillPathDataIsReceived(DBPath(`nodeRevisions/${revisionID}`));
							} finally {
								if (parentNode) SetNodeUILocked(parentNode._id, false);
							}
						}}/>
						{/* error && <Pre>{error.message}</Pre> */}
					</Row>}
			</Column>
		);
	}
}
