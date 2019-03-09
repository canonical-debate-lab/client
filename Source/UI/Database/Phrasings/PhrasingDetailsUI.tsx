import { Clone, GetEntries, GetErrorMessagesUnderElement } from 'js-vextensions';
import Moment from 'moment';
import { Column, Pre, RowLR, Select, TextArea, TextInput, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, GetDOM } from 'react-vextensions';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { AddPhrasing } from 'Server/Commands/AddPhrasing';
import { MapNodePhrasing, MapNodePhrasingType } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { Connect, Link } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { Fragment } from 'react';
import { ACTUserSelect } from 'Store/main/database';
import { ACTSetPage, ACTSetSubpage } from 'Store/main';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { GetUser } from '../../../Store/firebase/users';

type Props = {baseData: MapNodePhrasing, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: MapNodePhrasing, error: string)=>void};
const connector = (state, { baseData, forNew }: Props) => ({
	creator: !forNew && GetUser(baseData.creator),
});
@Connect(connector)
export class PhrasingDetailsUI extends BaseComponentWithConnector(connector, { newData: null as MapNodePhrasing, dataError: null as string }) {
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}
	OnChange() {
		const { onChange } = this.props;
		const newData = this.GetNewData();
		const error = this.GetValidationError();
		if (onChange) onChange(newData, error);
		this.SetState({ newData, dataError: error });
	}

	render() {
		const { forNew, enabled, style, creator } = this.props;
		const { newData } = this.state;
		const Change = _ => this.OnChange();

		const splitAt = 100;
		return (
			<Column style={style}>
				{!forNew &&
					<Column sel>
						<Row>ID: {newData._key}</Row>
						<Row>
							<Pre>Created at: {Moment(newData.createdAt).format('YYYY-MM-DD HH:mm:ss')} (by: </Pre>
							<Link text={creator ? creator.displayName : 'n/a'}
								actions={[new ACTSetPage('database'), new ACTSetSubpage({ page: 'database', subpage: 'users' }), new ACTUserSelect({ id: creator._key })]} />
							<Pre>)</Pre>
						</Row>
					</Column>}
				<RowLR mt={5} splitAt={splitAt} style={{ width: '100%' }}>
					<Pre>Type: </Pre>
					<Select options={GetEntries(MapNodePhrasingType)} enabled={false} style={ES({ flex: 1 })}
						value={newData.type} onChange={val => Change(newData.type = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width: '100%' }}>
					<Pre>Text: </Pre>
					<TextInput required enabled={enabled} style={ES({ flex: 1 })}
						value={newData.text} onChange={val => Change(newData.text = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width: '100%' }}>
					<Pre>Description: </Pre>
					<TextArea enabled={enabled} autoSize={true} style={ES({ flex: 1 })}
						value={newData.description} onChange={val => Change(newData.description = val)}/>
				</RowLR>
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as MapNodePhrasing;
	}
}

export function ShowAddPhrasingDialog(nodeID: number, type: MapNodePhrasingType) {
	let newEntry = new MapNodePhrasing({
		node: nodeID,
		type,
	});

	let valid = false;
	const boxController: BoxController = ShowMessageBox({
		title: 'Add phrasing', cancelButton: true,
		message: () => {
			boxController.options.okButtonClickable = valid;
			return (
				<Column style={{ padding: '10px 0', width: 800 }}>
					<PhrasingDetailsUI baseData={newEntry} forNew={true}
						onChange={(val, error) => {
							newEntry = val;
							valid = !error;
							boxController.UpdateUI();
						}}/>
				</Column>
			);
		},
		onOK: () => {
			new AddPhrasing({ phrasing: newEntry }).Run();
		},
	});
}