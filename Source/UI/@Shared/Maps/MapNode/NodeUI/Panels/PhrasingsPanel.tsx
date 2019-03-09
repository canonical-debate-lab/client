import { Column, Button, Row, CheckBox, Pre } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponent } from 'react-vextensions';
import { Connect, InfoButton } from 'Utils/FrameworkOverrides';
import { PropNameToTitle } from 'Utils/General/Others';
import { GetNodeDisplayText } from 'Store/firebase/nodes/$node';
import { MapNodePhrasing, MapNodePhrasingType } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { ShowAddPhrasingDialog, PhrasingDetailsUI } from 'UI/Database/Phrasings/PhrasingDetailsUI';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { GetUser, MeID } from 'Store/firebase/users';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { GetNodePhrasings } from 'Store/firebase/nodePhrasings';
import { GetNodeColor, MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { MapNode, MapNodeL2, MapNodeL3 } from '../../../../../../Store/firebase/nodes/@MapNode';
import { DetailsPanel_Phrasings } from './Phrasings_SubPanels/DetailsPanel';

const Phrasing_FakeID = 'FAKE';

type Props = {node: MapNodeL2, path: string};
const connector = (state, { node }: Props) => ({
	phrasings: GetNodePhrasings(node._id),
});
@Connect(connector)
export class PhrasingsPanel extends BaseComponentWithConnector(connector, { selectedPhrasingID: null as string }) {
	render() {
		let { node, path, phrasings } = this.props;
		const { selectedPhrasingID } = this.state;

		// add one fake "precise" phrasing, matching the node's current text (temp)
		phrasings = phrasings.slice();
		phrasings.push(new MapNodePhrasing({ _key: Phrasing_FakeID, node: node._id, type: MapNodePhrasingType.Precise, text: GetNodeDisplayText(node) }));

		return (
			<Column style={{ position: 'relative' }}>
				<Row>
					<Pre style={{ fontSize: 17 }}>Precise Phrasings</Pre>
					<InfoButton ml={5} text={'Precise phrasings are variants of the node\'s title that are meant to "compete" as the node\'s main display text. They should strive to be concise, of high quality, and neutral (ie. avoiding rhetoric).'}/>
					<Button ml="auto" text="Add phrasing" enabled={CanGetBasicPermissions(MeID()) && false} title="Add precise phrasing-variant for this node (disabled at the moment)" onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						ShowAddPhrasingDialog(node._id, MapNodePhrasingType.Precise);
					}}/>
				</Row>
				<Column ptb={5}>
					{phrasings.filter(a => a.type == MapNodePhrasingType.Precise).map((phrasing, index) => {
						return <PhrasingRow key={index} phrasing={phrasing} index={index} selected={phrasing._key == selectedPhrasingID} toggleSelected={() => this.TogglePhrasingSelected(phrasing._key)}/>;
					})}
				</Column>
				<Row>
					<Pre style={{ fontSize: 17 }}>Natural Phrasings</Pre>
					<InfoButton ml={5} text="Natural phrasings are variants of the node's title that you'd hear in everyday life. These aren't used as the main display text, but can help people better understand the meaning."/>
					<Button ml="auto" text="Add phrasing" enabled={CanGetBasicPermissions(MeID())} title="Add natural phrasing-variant for this node" onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						ShowAddPhrasingDialog(node._id, MapNodePhrasingType.Natural);
					}}/>
				</Row>
				<Column ptb={5}>
					{phrasings.filter(a => a.type == MapNodePhrasingType.Natural).length == 0 &&
						<Pre style={{ color: 'rgba(255,255,255,.5)' }}>No natural phrasings submitted yet.</Pre>}
					{phrasings.filter(a => a.type == MapNodePhrasingType.Natural).map((phrasing, index) => {
						return <PhrasingRow key={index} phrasing={phrasing} index={index} selected={phrasing._key == selectedPhrasingID} toggleSelected={() => this.TogglePhrasingSelected(phrasing._key)}/>;
					})}
				</Column>
			</Column>
		);
	}
	TogglePhrasingSelected(phrasingID: string) {
		const { selectedPhrasingID } = this.state;
		this.SetState({ selectedPhrasingID: selectedPhrasingID == phrasingID ? null : phrasingID });
	}
}

const PhrasingRow_connector = (state, { phrasing }: {phrasing: MapNodePhrasing, index: number, selected: boolean, toggleSelected: ()=>any}) => ({
});
@Connect(PhrasingRow_connector)
export class PhrasingRow extends BaseComponentWithConnector(PhrasingRow_connector, {}) {
	render() {
		const { phrasing, index, selected, toggleSelected } = this.props;
		return (
			<Row mt={index == 0 ? 0 : 3} style={{ position: 'relative', backgroundColor: `rgba(255,255,255,${selected ? 0.3 : 0.15})`, borderRadius: 5, padding: '2px 5px', cursor: 'pointer' }} onClick={(event) => {
				if (event.defaultPrevented) return;
				if (phrasing._key == Phrasing_FakeID) return;
				toggleSelected();
				// event.preventDefault();
				// return false;
			}}>
				{/* <CheckBox checked={true} onChange={(val) => {
					// todo: have this change which phrasing is selected to be used (in your client), for viewing/setting ratings in the ratings panels // nvm, having shared ratings -- for now at least
				}}/> */}
				<Pre>{phrasing.text}</Pre>
				{/* <Pre title="Quality">Q: 50%</Pre> */}
				{selected &&
					<Phrasing_RightPanel phrasing={phrasing}/>}
			</Row>
		);
	}
}

const Phrasing_RightPanel_connector = (state, {}: {phrasing: MapNodePhrasing}) => ({
});
// @Connect(Phrasing_RightPanel_connector)
class Phrasing_RightPanel extends BaseComponentWithConnector(Phrasing_RightPanel_connector, {}) {
	render() {
		const { phrasing } = this.props;
		const backgroundColor = GetNodeColor({ type: MapNodeType.Category } as any);
		return (
			<Row
				style={{
					position: 'absolute', left: '100%', top: '0%', width: 500, zIndex: 7, cursor: 'auto',
					padding: 5, background: backgroundColor.css(), borderRadius: 5, boxShadow: 'rgba(0,0,0,1) 0px 0px 2px',
				}}
				onClick={(e) => {
					// block click from trigger onClick of parent phrasing-row component (which would cause closing of this panel!)
					// return false;
					e.preventDefault();
				}}>
				<DetailsPanel_Phrasings phrasing={phrasing}/>
			</Row>
		);
	}
}

/*
todo:
1) ms you can add/edit/delete phrasings, with natural phrasings having extra "description" field
	[later on we will disable editing/deleting once a certain number of people have voted on it]
2) ms you can vote on the quality of phrasings
3) ms mods can mark phrasings as "spam"/"not spam"
	[Later on, people will have way of contesting this, forcing their phrasing to stay visible. Super-mods/admins can override this though -- though this also sends it to neutrality portal.]
4) ms mods can mark phrasings as "superseded by..."/"not superseded" (its votes are then considered votes for the new version as well -- this allows fixing of typos and such)
	[Later on, people will have way of contesting this, forcing their phrasing to stay a distinct entry. Super-mods/admins can override this though -- though this also sends it to neutrality portal.]
5) ms highest-rated phrasing (that's evaluated as not-spam and not-superseded based on mod markings) is used as node text
*/