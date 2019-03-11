import { GetNodeRevisions } from 'Store/firebase/nodeRevisions';
import { User } from 'Store/firebase/users/@User';
import Moment from 'moment';
import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { ScrollView } from 'react-vscrollview';
import { Connect } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { Map } from '../../../../../../Store/firebase/maps/@Map';
import { GetParentNodeL3 } from '../../../../../../Store/firebase/nodes';
import { GetLinkUnderParent } from '../../../../../../Store/firebase/nodes/$node';
import { ChildEntry, MapNodeL3 } from '../../../../../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../../../../../Store/firebase/nodes/@MapNodeRevision';
import { IsUserCreatorOrMod } from '../../../../../../Store/firebase/userExtras';
import { GetUser, MeID } from '../../../../../../Store/firebase/users';
import { NodeDetailsUI } from '../../NodeDetailsUI';

export const columnWidths = [0.15, 0.3, 0.35, 0.2];

const connector = (state, { node, path }: {map?: Map, node: MapNodeL3, path: string}) => ({
	// _link: GetLinkUnderParent(node._id, GetParentNode(path)),
	creator: GetUser(node.creator),
	revisions: GetNodeRevisions(node._key),
});
@Connect(connector)
export class HistoryPanel extends BaseComponentWithConnector(connector, {}) {
	detailsUI: NodeDetailsUI;
	render() {
		let { map, node, path, creator, revisions } = this.props;
		// let mapID = map ? map._id : null;

		// we want the newest ones listed first
		revisions = revisions.OrderByDescending(a => a._key);

		const creatorOrMod = IsUserCreatorOrMod(MeID(), node);
		return (
			<Column style={{ position: 'relative', maxHeight: 300 }}>
				<Column className="clickThrough" style={{ background: 'rgba(0,0,0,.7)', borderRadius: '10px 10px 0 0' }}>
					<Row style={{ padding: '4px 7px' }}>
						<span style={{ flex: columnWidths[0], fontWeight: 500, fontSize: 17 }}>ID</span>
						<span style={{ flex: columnWidths[1], fontWeight: 500, fontSize: 17 }}>Date</span>
						<span style={{ flex: columnWidths[2], fontWeight: 500, fontSize: 17 }}>User</span>
						<span style={{ flex: columnWidths[3], fontWeight: 500, fontSize: 17 }}>Actions</span>
					</Row>
				</Column>
				<ScrollView className="selectable" style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative' })}>
					{revisions.map((revision, index) => {
						return <RevisionEntryUI key={revision._key} index={index} last={index == revisions.length - 1} revision={revision} node={node} path={path}/>;
					})}
				</ScrollView>
			</Column>
		);
	}
}

type RevisionEntryUI_Props = {index: number, last: boolean, revision: MapNodeRevision, node: MapNodeL3, path: string}
	& Partial<{creator: User, link: ChildEntry, parent: MapNodeL3}>;
@Connect((state, { revision, node, path }: RevisionEntryUI_Props) => {
	const parent = GetParentNodeL3(path);
	return ({
		creator: GetUser(revision.creator),
		link: GetLinkUnderParent(node._key, parent),
		parent,
	});
})
class RevisionEntryUI extends BaseComponent<RevisionEntryUI_Props, {}> {
	render() {
		const { index, last, revision, node, path, creator, link, parent } = this.props;
		return (
			<Row p="4px 7px" style={E(
				{ background: index % 2 == 0 ? 'rgba(30,30,30,.7)' : 'rgba(0,0,0,.7)' },
				last && { borderRadius: '0 0 10px 10px' },
			)}>
				<span style={{ flex: columnWidths[0] }}>{revision._key}</span>
				<span style={{ flex: columnWidths[1] }}>{Moment(revision.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
				<span style={{ flex: columnWidths[2] }}>{creator ? creator.displayName : 'n/a'}</span>
				<span style={{ flex: columnWidths[3] }}>
					<Button text="V" title="View details" style={{ margin: '-2px 0', padding: '1px 3px' }} onClick={() => {
						const boxController: BoxController = ShowMessageBox({
							title: `Details for revision #${revision._key}`, cancelOnOverlayClick: true,
							message: () => {
								return (
									<div style={{ minWidth: 500 }}>
										<NodeDetailsUI
											baseData={node} baseRevisionData={revision} baseLinkData={link} parent={parent}
											forNew={false} forOldRevision={true} enabled={false}/>
									</div>
								);
							},
						});
					}}/>
				</span>
			</Row>
		);
	}
}
