import { GetErrorMessagesUnderElement, Clone } from 'js-vextensions';
import Moment from 'moment';
import { Column, Pre, RowLR, TextInput, Row, Button } from 'react-vcomponents';
import { BaseComponent, GetDOM, BaseComponentPlus } from 'react-vextensions';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { User } from 'Store/firebase/users/@User';
import { Connect, Watch, GetUpdates } from 'Utils/FrameworkOverrides';
import { UpdateTimeline } from 'Server/Commands/UpdateTimeline';
import { GetUser } from '../../../Store/firebase/users';
import { IDAndCreationInfoUI } from '../CommonPropUIs/IDAndCreationInfoUI';

export class TimelineDetailsUI extends BaseComponentPlus({ enabled: true } as {baseData: Timeline, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Timeline, ui: TimelineDetailsUI)=>void}, {} as { newData: Timeline }) {
	static defaultProps = { enabled: true };
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}

	render() {
		const { baseData, forNew, enabled, style, onChange } = this.props;
		const { newData } = this.state;
		const creator = Watch(() => !forNew && GetUser(baseData.creator), [baseData.creator, forNew]);

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

export class TimelineDetailsEditor extends BaseComponentPlus({} as {timeline: Timeline}, { dataError: null as string }) {
	/* ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.timeline != this.props.timeline) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	} */
	detailsUI: TimelineDetailsUI;
	render() {
		const { timeline } = this.props;
		// const { newData, dataError } = this.state;
		const { dataError } = this.state;
		return (
			<>
				<TimelineDetailsUI ref={c => this.detailsUI = c} baseData={timeline} forNew={false}
					onChange={(newData, ui) => {
						// this.SetState({ newData, dataError: ui.GetValidationError() });
						this.SetState({ dataError: ui.GetValidationError() });
					}}/>
				<Row>
					<Button text="Save" enabled={dataError == null} onLeftClick={async () => {
						const updates = GetUpdates(timeline, this.detailsUI.GetNewData()).Excluding('steps');
						new UpdateTimeline({ id: timeline._key, updates }).Run();
					}}/>
					{/* error && <Pre>{error.message}</Pre> */}
				</Row>
			</>
		);
	}
}
