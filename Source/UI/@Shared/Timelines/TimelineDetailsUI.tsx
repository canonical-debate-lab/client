import { GetErrorMessagesUnderElement, Clone } from 'js-vextensions';
import Moment from 'moment';
import { Column, Pre, RowLR, TextInput } from 'react-vcomponents';
import { BaseComponent, GetDOM } from 'react-vextensions';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { User } from 'Store/firebase/users/@User';
import { Connect } from 'Utils/FrameworkOverrides';
import { GetUser } from '../../../Store/firebase/users';
import { IDAndCreationInfoUI } from '../CommonPropUIs/IDAndCreationInfoUI';

type Props = {baseData: Timeline, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Timeline, ui: TimelineDetailsUI)=>void}
	& Partial<{creator: User}>;
@Connect((state, { baseData, forNew }: Props) => ({
	creator: !forNew && GetUser(baseData.creator),
}))
export class TimelineDetailsUI extends BaseComponent<Props, {newData: Timeline}> {
	static defaultProps = { enabled: true };
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
				{!forNew &&
					<IDAndCreationInfoUI id={newData._key} creator={creator} createdAt={newData.createdAt}/>}
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Name: </Pre>
					<TextInput required enabled={enabled} style={{ width: '100%' }}
						value={newData.name} onChange={val => Change(newData.name = val)}/>
				</RowLR>
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as Timeline;
	}
}
