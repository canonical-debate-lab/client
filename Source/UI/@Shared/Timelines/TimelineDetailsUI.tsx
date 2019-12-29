import { Clone, GetErrorMessagesUnderElement } from 'js-vextensions';
import { Button, Column, Pre, Row, RowLR, TextInput } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM } from 'react-vextensions';
import { UpdateTimeline } from 'Server/Commands/UpdateTimeline';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetUpdates } from 'vwebapp-framework';
import { GetUser } from '../../../Store/firebase/users';
import { IDAndCreationInfoUI } from '../CommonPropUIs/IDAndCreationInfoUI';

export class TimelineDetailsUI extends BaseComponentPlus({ enabled: true } as {baseData: Timeline, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: Timeline, ui: TimelineDetailsUI)=>void}, {} as { newData: Timeline }) {
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
					<Pre>Name: </Pre>
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
		return Clone(newData) as Timeline;
	}
}

export class TimelineDetailsEditor extends BaseComponentPlus({} as {timeline: Timeline, editing: boolean}, { dataError: null as string }) {
	/* ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.timeline != this.props.timeline) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	} */
	detailsUI: TimelineDetailsUI;
	render() {
		const { timeline, editing } = this.props;
		// const { newData, dataError } = this.state;
		const { dataError } = this.state;
		return (
			<>
				<TimelineDetailsUI ref={(c) => this.detailsUI = c} baseData={timeline} forNew={false} enabled={editing}
					onChange={(newData, ui) => {
						// this.SetState({ newData, dataError: ui.GetValidationError() });
						this.SetState({ dataError: ui.GetValidationError() });
					}}/>
				{editing &&
				<Row>
					<Button text="Save" enabled={dataError == null} onLeftClick={async () => {
						const updates = GetUpdates(timeline, this.detailsUI.GetNewData()).Excluding('steps');
						new UpdateTimeline({ id: timeline._key, updates }).Run();
					}}/>
					{/* error && <Pre>{error.message}</Pre> */}
				</Row>}
			</>
		);
	}
}
