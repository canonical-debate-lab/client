import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { SetNodeUILocked } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { Button, Column, Row } from 'react-vcomponents';
import { MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { GetLinkUnderParent } from 'Store/firebase/nodes/$node';
import { GetParentNode, IsNodeSubnode, GetParentNodeL3, GetParentNodeID } from 'Store/firebase/nodes';
import { GetUser, MeID } from 'Store/firebase/users';
import { Connect, GetUpdates, RemoveHelpers, WaitTillPathDataIsReceived, DBPath } from 'vwebapp-framework/Source';
import { BaseComponentWithConnector } from 'react-vextensions';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { UpdateLink } from 'Server/Commands/UpdateLink';
import { AddNodeRevision } from 'Server/Commands/AddNodeRevision';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { PhrasingDetailsUI } from 'UI/Database/Phrasings/PhrasingDetailsUI';
import { UpdatePhrasing } from 'Server/Commands/UpdatePhrasing';
import { ShowMessageBox } from 'react-vmessagebox';
import { DeletePhrasing } from 'Server/Commands/DeletePhrasing';
import { NodeDetailsUI } from '../../../NodeDetailsUI';

const connector = (state, { phrasing }: {phrasing: MapNodePhrasing}) => ({
	creator: GetUser(phrasing.creator),
});
@Connect(connector)
export class DetailsPanel_Phrasings extends BaseComponentWithConnector(connector, { dataError: null as string }) {
	detailsUI: PhrasingDetailsUI;
	render() {
		const { phrasing } = this.props;
		const { dataError } = this.state;

		const creatorOrMod = IsUserCreatorOrMod(MeID(), phrasing);
		return (
			<Column style={{ position: 'relative', width: '100%' }}>
				<PhrasingDetailsUI ref={c => this.detailsUI = c}
					baseData={phrasing} forNew={false} enabled={creatorOrMod}
					onChange={(val, error) => {
						this.SetState({ dataError: error });
					}}/>
				{creatorOrMod &&
					<Row mt={5}>
						<Button text="Save" enabled={dataError == null} onLeftClick={async () => {
							const phrasingUpdates = GetUpdates(phrasing, this.detailsUI.GetNewData());
							if (phrasingUpdates.VKeys(true).length) {
								await new UpdatePhrasing(E({ id: phrasing._key, updates: phrasingUpdates })).Run();
							}
						}}/>
						<Button ml="auto" text="Delete" onLeftClick={async () => {
							ShowMessageBox({
								title: 'Delete phrasing', cancelButton: true,
								message: `
									Delete the node phrasing below?

									Text: ${phrasing.text}
								`.AsMultiline(0),
								onOK: async () => {
									await new DeletePhrasing({ id: phrasing._key }).Run();
								},
							});
						}}/>
					</Row>}
			</Column>
		);
	}
}
