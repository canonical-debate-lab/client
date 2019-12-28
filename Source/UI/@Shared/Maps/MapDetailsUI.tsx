import { GetErrorMessagesUnderElement, Clone, ToNumber, DEL } from 'js-vextensions';
import Moment from 'moment';
import { CheckBox, Column, Pre, RowLR, Spinner, TextInput, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { InfoButton } from 'vwebapp-framework';
import { PermissionInfoType, MapNodeRevision, MapNodeRevision_Defaultable_props, PermissionInfo, MapNodeRevision_Defaultable_DefaultsForMap } from 'Store/firebase/nodes/@MapNodeRevision';
import { Map, Map_namePattern, MapType } from '../../../Store/firebase/maps/@Map';
import { GetUser } from '../../../Store/firebase/users';
import { IDAndCreationInfoUI } from '../CommonPropUIs/IDAndCreationInfoUI';
import { PermissionsOptions } from './MapNode/NodeDetailsUI';

type Props = {baseData: Map, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Map, ui: MapDetailsUI)=>void};
export class MapDetailsUI extends BaseComponentPlus({ enabled: true } as Props, { newData: null as Map }) {
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}

	render() {
		const { baseData, forNew, enabled, style, onChange } = this.props;
		const { newData } = this.state;
		const creator = !forNew && GetUser(baseData.creator);
		const Change = (_) => {
			if (onChange) onChange(this.GetNewData(), this);
			this.Update();
		};

		const splitAt = 230;
		const width = 600;
		return (
			<Column style={style}>
				{!forNew &&
					<IDAndCreationInfoUI id={baseData._key} creator={creator} createdAt={newData.createdAt}/>}
				<RowLR mt={5} splitAt={100} style={{ width }}>
					<Pre>Name:</Pre>
					<TextInput
						pattern={Map_namePattern} required
						enabled={enabled} style={{ width: '100%' }}
						value={newData.name} onChange={(val) => Change(newData.name = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={100} style={{ width }}>
					<Pre>Note:</Pre>
					<TextInput enabled={enabled} style={{ width: '100%' }}
						value={newData.note} onChange={(val) => Change(newData.note = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={100} style={{ width }}>
					<Pre>Inline note:</Pre>
					<CheckBox enabled={enabled} style={{ width: '100%' }}
						checked={newData.noteInline} onChange={(val) => Change(newData.noteInline = val)}/>
				</RowLR>
				{!forNew &&
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Default expand depth:</Pre>
					<Spinner min={1} max={3} enabled={enabled}
						value={ToNumber(newData.defaultExpandDepth, 0)} onChange={(val) => Change(newData.defaultExpandDepth = val)}/>
				</RowLR>}
				{!forNew &&
				<RowLR mt={5} splitAt={splitAt}>
					<Pre>Default timeline:</Pre>
					<TextInput enabled={enabled} value={newData.defaultTimelineID} onChange={(val) => Change(newData.defaultTimelineID = val)}/>
				</RowLR>}
				{newData.type == MapType.Private && !forNew &&
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Row center>
						<Pre>Require map-editors can edit:</Pre>
						<InfoButton ml={5} text={`
							Requires that any private nodes contributed have the Edit permission set to MapEditors.
							(Note: Doesn't apply to already-contributed nodes; those can be unlinked, then cloned as private nodes.)
						`.AsMultiline(0)}/>
					</Row>
					<CheckBox enabled={enabled} checked={newData.requireMapEditorsCanEdit} onChange={(val) => Change(newData.requireMapEditorsCanEdit = val)}/>
				</RowLR>}
				{/* <RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Row center>
						<Pre>Allow public nodes:</Pre>
						<InfoButton ml={5} text=""/>
					</Row>
					<CheckBox enabled={enabled} checked={newData.allowPublicNodes} onChange={(val) => Change(newData.allowPublicNodes = val)}/>
				</RowLR> */}
				{/*! forNew &&
					<RowLR mt={5} splitAt={splitAt} style={{width}}>
						<Pre>Root-node ID: </Pre>
						<Spinner enabled={enabled} style={{width: "100%"}}
							value={newData.rootNode} onChange={val=>Change(newData.rootNode = val)}/>
					</RowLR> */}
				{!forNew && // we don't want to overwhelm new users trying to create their own map...
				<Column mt={10}>
					<CheckBox text="Node defaults:" checked={newData.nodeDefaults != null} onChange={(val) => {
						const defaultNodeDefaults = MapNodeRevision_Defaultable_DefaultsForMap(newData.type);
						newData.VSet('nodeDefaults', val ? defaultNodeDefaults : DEL);
						this.Update();
					}}/>
					{newData.nodeDefaults != null &&
					<Column ml={20}>
						<PermissionsOptions newRevisionData={newData.nodeDefaults} enabled={enabled} forDefaultsInMap={true} Change={() => {
							if (newData.nodeDefaults.permission_edit.type == PermissionInfoType.Creator && newData.requireMapEditorsCanEdit) {
								newData.nodeDefaults.permission_edit.type = PermissionInfoType.MapEditors;
							}
							this.Update();
						}}/>
					</Column>}
				</Column>}
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
