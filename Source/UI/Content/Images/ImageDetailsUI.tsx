import { Spinner } from 'react-vcomponents';
import { Assert, GetEntries } from 'js-vextensions';
import { BaseComponent, GetDOM } from 'react-vextensions';
import { Column } from 'react-vcomponents';
import { TextInput } from 'react-vcomponents';
import Moment from 'moment';
import { User } from 'Store/firebase/users/@User';
import { Select } from 'react-vcomponents';
import { CheckBox } from 'react-vcomponents';
import { ScrollView } from 'react-vscrollview';
import { Button } from 'react-vcomponents';
import { Div, Span, Pre, Row, RowLR } from 'react-vcomponents';
import { GetErrorMessagesUnderElement } from 'js-vextensions';
import { Connect } from 'Utils/FrameworkOverrides';
import {Image, Image_namePattern, Image_urlPattern, ImageType, GetNiceNameForImageType} from "../../../Store/firebase/images/@Image";
import SourceChainsEditorUI from "../../@Shared/Maps/MapNode/SourceChainsEditorUI";
import { GetUser } from '../../../Store/firebase/users';
import { Term, TermType, Term_nameFormat, Term_disambiguationFormat } from '../../../Store/firebase/terms/@Term';

type Props = {baseData: Image, creating: boolean, editing: boolean, style?, onChange?: (newData: Image, error: string)=>void}
	& Partial<{creator: User, variantNumber: number}>;
@Connect((state, {baseData, creating}: Props)=>({
	creator: !creating && GetUser(baseData.creator),
	}))
export default class ImageDetailsUI extends BaseComponent<Props, {newData: Image, dataError: string}> {
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}
	OnChange() {
		const { onChange } = this.props;
		const error = this.GetValidationError();
		if (onChange) onChange(this.GetNewData(), error);
		// this.Update();
		this.SetState({ dataError: error });
	}

	scrollView: ScrollView;
	render() {
		const { creating, editing, style, onChange, creator, variantNumber } = this.props;
		const { newData, dataError } = this.state;
		const Change = _ => this.OnChange();

		const splitAt = 170; const
			width = 600;
		return (
			<Column style={style}>
				{!creating
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
						pattern={Image_namePattern} required
						enabled={creating || editing} style={{ width: '100%' }}
						value={newData.name} onChange={val => Change(newData.name = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Type: </Pre>
					<Select options={GetEntries(ImageType, name => GetNiceNameForImageType(ImageType[name]))} enabled={creating || editing} style={ES({ flex: 1 })}
						value={newData.type} onChange={val => Change(newData.type = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>URL: </Pre>
					<TextInput
						pattern={Image_urlPattern} required
						enabled={creating || editing} style={{ width: '100%' }}
						value={newData.url} onChange={val => Change(newData.url = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width: '100%' }}>
					<Pre>Description: </Pre>
					<TextInput enabled={creating || editing} style={ES({ flex: 1 })}
						value={newData.description} onChange={val => Change(newData.description = val)}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt}style={{ display: 'flex', alignItems: 'center' }}>
					<Pre>Preview width: </Pre>
					<Div>
						<Spinner max={100} enabled={creating || editing}
							value={newData.previewWidth | 0} onChange={val => Change(newData.previewWidth = val != 0 ? val : null)}/>
						<Pre>% (0 for auto)</Pre>
					</Div>
				</RowLR>
				<Row mt={10}>Source chains:</Row>
				<Row mt={5}>
					<SourceChainsEditorUI ref={c => this.chainsEditor = c} enabled={creating || editing} baseData={newData.sourceChains} onChange={val => Change(newData.sourceChains = val)}/>
				</Row>
				<Column mt={10}>
					<Row style={{ fontWeight: 'bold' }}>Preview:</Row>
					<Row mt={5} style={{ display: 'flex', alignItems: 'center' }}>
						<img src={newData.url} style={{ width: newData.previewWidth != null ? `${newData.previewWidth}%` : null, maxWidth: '100%' }}/>
					</Row>
				</Column>
				{dataError && dataError != 'Please fill out this field.' && <Row mt={5} style={{ color: 'rgba(200,70,70,1)' }}>{dataError}</Row>}
			</Column>
		);
	}
	chainsEditor: SourceChainsEditorUI;
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0] || this.chainsEditor.GetValidationError();
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as Image;
	}
}
