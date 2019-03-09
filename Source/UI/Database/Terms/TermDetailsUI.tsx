import { MeID } from 'Store/firebase/users';
import { User } from 'Store/firebase/users/@User';
import { GetErrorMessagesUnderElement, GetEntries, Clone } from 'js-vextensions';
import Moment from 'moment';
import { CheckBox, Column, Pre, Row, RowLR, Select, TextInput } from 'react-vcomponents';
import { BaseComponent, GetDOM } from 'react-vextensions';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { InfoButton, Connect } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { AddTerm } from '../../../Server/Commands/AddTerm';
import { TermComponent } from '../../../Store/firebase/termComponents/@TermComponent';
import { GetTermVariantNumber } from '../../../Store/firebase/terms';
import { Term, TermType, Term_disambiguationFormat, Term_nameFormat } from '../../../Store/firebase/terms/@Term';
import { GetUser } from '../../../Store/firebase/users';
import { GetNiceNameForTermType } from '../../Database/TermsUI';

type Props = {baseData: Term, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Term, error: string)=>void}
	& Partial<{creator: User, variantNumber: number}>;
@Connect((state, { baseData, forNew }: Props) => ({
	creator: !forNew && GetUser(baseData.creator),
	variantNumber: !forNew && GetTermVariantNumber(baseData),
}))
export class TermDetailsUI extends BaseComponent<Props, {newData: Term, dataError: string, selectedTermComponent: TermComponent}> {
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
		const { forNew, enabled, style, onChange, creator, variantNumber } = this.props;
		const { newData, selectedTermComponent } = this.state;
		const Change = _ => this.OnChange();

		const splitAt = 170; const
			width = 600;
		return (
			<Column style={style}>
				{!forNew &&
					<table className="selectableAC" style={{/* borderCollapse: "separate", borderSpacing: "10px 0" */}}>
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
						pattern={Term_nameFormat} required
						enabled={enabled} style={{ width: '100%' }}
						value={newData.name} onChange={val => Change(newData.name = val)}/>
				</RowLR>
				{!forNew &&
					<RowLR mt={5} splitAt={splitAt} style={{ width }}>
						<Pre>Variant #: </Pre>
						<Pre>{variantNumber}</Pre>
					</RowLR>}
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Row>
						<Pre>Disambiguation: </Pre>
						<InfoButton text={'This is only needed if the word has multiple meanings, and you want to specify which one you\'re defining.'
							+ '\n\nExample: "element", "planet", and "mythology" would be suitable "disambiguation" texts for the different terms of "Mercury".'}/>
					</Row>
					<TextInput enabled={enabled} style={{ width: '100%' }} pattern={Term_disambiguationFormat}
						value={newData.disambiguation} onChange={val => Change(newData.VSet('disambiguation', val, { deleteEmpty: true }))}/>
				</RowLR>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Type: </Pre>
					<Select options={GetEntries(TermType, name => GetNiceNameForTermType(TermType[name]))} enabled={enabled} style={ES({ flex: 1 })}
						value={newData.type} onChange={val => Change(newData.type = val)}/>
				</RowLR>
				{(newData.type == TermType.SpecificEntity || newData.type == TermType.EntityType) &&
					<RowLR mt={5} splitAt={splitAt} style={{ width }}>
						<Pre>Person: </Pre>
						<CheckBox enabled={enabled} checked={newData.person} onChange={val => Change(newData.person = val)}/>
					</RowLR>}
				{/* newData.type == TermType.Action &&
					<RowLR mt={5} splitAt={splitAt} style={{width}}>
						<Pre>As gerund (noun): </Pre>
						<TextInput enabled={enabled} style={{width: "100%"}}
							value={newData.name_gerund} onChange={val=>Change(newData.name_gerund = val)}/>
					</RowLR> */}
				<RowLR mt={5} splitAt={splitAt} style={{ width: '100%' }}>
					<Pre>Short description: </Pre>
					<TextInput enabled={enabled} style={ES({ flex: 1 })} required
						value={newData.shortDescription_current} onChange={val => Change(newData.shortDescription_current = val)}/>
				</RowLR>
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as Term;
	}
}

export function ShowAddTermDialog() {
	let newTerm = new Term({
		name: '',
		type: TermType.SpecificEntity,
		shortDescription_current: '',
	});

	let valid = false;
	const boxController: BoxController = ShowMessageBox({
		title: 'Add term', cancelButton: true,
		message: () => {
			boxController.options.okButtonClickable = valid;
			return (
				<Column style={{ padding: '10px 0', width: 600 }}>
					<TermDetailsUI baseData={newTerm} forNew={true}
						onChange={(val, error) => {
							newTerm = val;
							valid = !error;
							boxController.UpdateUI();
						}}/>
				</Column>
			);
		},
		onOK: () => {
			new AddTerm({ term: newTerm }).Run();
		},
	});
}