import { GetErrorMessagesUnderElement } from 'js-vextensions';
import Moment from 'moment';
import { CheckBox, Column, Pre, RowLR, Spinner, TextInput } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { Connect } from '../../../Frame/Database/FirebaseConnect';
import { Map, Map_namePattern } from '../../../Store/firebase/maps/@Map';
import { GetUser } from '../../../Store/firebase/users';

type Props = {baseData: Map, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Map, ui: MapDetailsUI)=>void};
const connector = (state, { baseData, forNew }: Props) => ({
	creator: !forNew && GetUser(baseData.creator),
});
@Connect(connector)
export class MapDetailsUI extends BaseComponentWithConnector(connector, { newData: null as Map }) {
	static defaultProps = {enabled: true};
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}

	render() {
		const { forNew, enabled, style, onChange, creator } = this.props;
		const { newData } = this.state;
		const Change = (_) => {
			if (onChange) onChange(this.GetNewData(), this);
			this.Update();
		};

		const splitAt = 170; const
			width = 600;
		return (
			<Column style={style}>
				{!forNew
					&& <table className="selectableAC" style={{/* borderCollapse: "separate", borderSpacing: "10px 0" */}}>
						<thead>
							<tr><th>ID</th><th>Creator</th><th>Created at</th></tr>
						</thead>
						<tbody>
							<tr>
								<td>{newData._id}</td>
								<td>{creator ? creator.displayName : 'n/a'}</td>
								<td>{Moment(newData.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td>
							</tr>
						</tbody>
					</table>}
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Name: </Pre>
					<TextInput
						pattern={Map_namePattern} required
						enabled={enabled} style={{ width: '100%' }}
						value={newData.name} onChange={val => Change(newData.name = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Note: </Pre>
					<TextInput enabled={enabled} style={{ width: '100%' }}
						value={newData.note} onChange={val => Change(newData.note = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Inline note: </Pre>
					<CheckBox enabled={enabled} style={{ width: '100%' }}
						checked={newData.noteInline} onChange={val => Change(newData.noteInline = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Default expand depth: </Pre>
					<Spinner min={1} max={3} enabled={enabled}
						value={newData.defaultExpandDepth | 0} onChange={val => Change(newData.defaultExpandDepth = val)}/>
				</RowLR>
				{/*! forNew &&
					<RowLR mt={5} splitAt={splitAt} style={{width}}>
						<Pre>Root-node ID: </Pre>
						<Spinner enabled={enabled} style={{width: "100%"}}
							value={newData.rootNode} onChange={val=>Change(newData.rootNode = val)}/>
					</RowLR> */}
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(this.DOM)[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as Map;
	}
}
