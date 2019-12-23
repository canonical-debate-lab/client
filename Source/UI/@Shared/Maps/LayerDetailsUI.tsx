import { GetErrorMessagesUnderElement, Clone } from 'js-vextensions';
import Moment from 'moment';
import { Column, Pre, RowLR, TextInput, Text } from 'react-vcomponents';
import { BaseComponent, GetDOM, BaseComponentPlus } from 'react-vextensions';
import { Layer } from 'Store/firebase/layers/@Layer';
import { User } from 'Store/firebase/users/@User';
import { GetUser } from 'Store/firebase/users';
import { IDAndCreationInfoUI } from '../CommonPropUIs/IDAndCreationInfoUI';

type Props = {baseData: Layer, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Layer, ui: LayerDetailsUI)=>void};
export class LayerDetailsUI extends BaseComponentPlus({ enabled: true } as Props, { newData: null as Layer }) {
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

		const splitAt = 170;
		const width = 600;
		return (
			<Column style={style}>
				{!forNew &&
					<IDAndCreationInfoUI id={baseData._key} creator={creator} createdAt={newData.createdAt}/>}
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Text>Name: </Text>
					<TextInput required enabled={enabled} style={{ width: '100%' }}
						value={newData.name} onChange={(val) => Change(newData.name = val)}/>
				</RowLR>
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as Layer;
	}
}
