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
				<Pre>{phrasing.text}</Pre>
				<Pre title="Conciseness">C: 50%</Pre>
				<Pre title="Neutrality">N: 50%</Pre>
			</Row>
		);
	}
}
