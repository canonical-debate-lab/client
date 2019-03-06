import { Column, Button, Row, CheckBox, Pre } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponent } from 'react-vextensions';
import { Connect } from 'Utils/FrameworkOverrides';
import { PropNameToTitle } from 'Utils/General/Others';
import { GetNodeDisplayText } from 'Store/firebase/nodes/$node';
import { MapNode, MapNodeL2 } from '../../../../../../Store/firebase/nodes/@MapNode';

class Phrasing {
	constructor(props: Partial<Phrasing>) {
		this.Extend(props);
	}
	text: string;
}

class PhrasingTypeButton extends BaseComponent<{type: string}, {}> {
	render() {
		const { type } = this.props;
		return (
			<Button ml={type != 'all' ? 5 : 0}>
				{type != 'all' &&
					<CheckBox checked={true} onChange={(val) => {}} checkboxStyle={{ marginLeft: -5 }}/>}
				{PropNameToTitle(type)}
			</Button>
		);
	}
}

type Props = {node: MapNodeL2, path: string};
const connector = (state, {}: Props) => ({
});
@Connect(connector)
export class PhrasingsPanel extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { node, path } = this.props;

		// temp
		const phrasings = [];
		phrasings.push(new Phrasing({ text: GetNodeDisplayText(node) }));

		return (
			<Column style={{ position: 'relative' }}>
				<Row>
					<PhrasingTypeButton type="all"/>
					<PhrasingTypeButton type="precise"/>
					<PhrasingTypeButton type="natural"/>
					<Button ml="auto" text="Add phrasing" title="Add phrasing variant"/>
				</Row>
				<Column>
					{phrasings.map((phrasing, index) => {
						return <PhrasingRow key={index} phrasing={phrasing}/>;
					})}
				</Column>
			</Column>
		);
	}
}

const PhrasingRow_connector = (state, { phrasing }: {phrasing: Phrasing}) => ({
});
@Connect(PhrasingRow_connector)
export class PhrasingRow extends BaseComponentWithConnector(PhrasingRow_connector, {}) {
	render() {
		const { phrasing } = this.props;
		return (
			<Row>
				{/* <CheckBox checked={true} onChange={(val) => {
					// todo: have this change which phrasing is selected to be used (in your client), for viewing/setting ratings in the ratings panels // nvm, having shared ratings -- for now at least
				}}/> */}
				<Pre>{phrasing.text}</Pre>
				<Pre title="Quality">Q: 50%</Pre>
			</Row>
		);
	}
}

/*
todo:
1) clean up UI
2) ms you can add/edit/delete phrasings, with natural phrasings having extra "description" field
	[later on we will disable editing/deleting once a certain number of people have voted on it]
3) ms you can vote on the quality of phrasings
4) ms mods can mark phrasings as "spam"/"not spam"
	[Later on, people will have way of contesting this, forcing their phrasing to stay visible. Super-mods/admins can override this though -- though this also sends it to neutrality portal.]
5) ms mods can mark phrasings as "superseded by..."/"not superseded" (its votes are then considered votes for the new version as well -- this allows fixing of typos and such)
	[Later on, people will have way of contesting this, forcing their phrasing to stay a distinct entry. Super-mods/admins can override this though -- though this also sends it to neutrality portal.]
6) ms highest-rated phrasing (that's evaluated as not-spam and not-superseded based on mod markings) is used as node text
*/
