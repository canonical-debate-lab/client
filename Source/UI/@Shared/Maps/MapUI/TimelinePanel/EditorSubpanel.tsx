import { Button, Row, Column, Pre, CheckBox, TextInput, TextArea, Select, Spinner } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponent } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { AddTimelineStep } from 'Server/Commands/AddTimelineStep';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { ES } from 'Utils/UI/GlobalStyles';
import { Connect, State, ACTSet } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { MeID } from 'Store/firebase/users';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { ShowEditTimelineStepDialog } from 'UI/@Shared/Timelines/Steps/TimelineStepDetailsUI';
import { DeleteTimelineStep } from 'Server/Commands/DeleteTimelineStep';
import { GetTimelineSteps } from 'Store/firebase/timelines';
import { GetSelectedTimeline, GetTimelineOpenSubpanel, TimelineSubpanel, GetTimelinePanelOpen } from 'Store/main/maps/$map';
import { UpdateTimelineStep } from 'Server/Commands/UpdateTimelineStep';
import { UpdateTimeline } from 'Server/Commands/UpdateTimeline';
import { Global, ToInt, ToNumber } from 'js-vextensions';
import { GetOpenMapID } from 'Store/main';
import { ShowMessageBox } from 'react-vmessagebox';
import { Timeline } from 'Store/firebase/timelines/@Timeline';

// for use by react-beautiful-dnd (using text replacement)
G({ LockMapEdgeScrolling });
function LockMapEdgeScrolling() {
	const mapID = GetOpenMapID();
	return State(a => a.main.lockMapScrolling) && GetTimelinePanelOpen(mapID) && GetTimelineOpenSubpanel(mapID) == TimelineSubpanel.Editor;
}

const EditorSubpanel_connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		selectedTimeline: timeline,
		selectedTimelineSteps: timeline && GetTimelineSteps(timeline),
		lockMapScrolling: State(a => a.main.lockMapScrolling),
	};
};
@Connect(EditorSubpanel_connector)
export class EditorSubpanel extends BaseComponentWithConnector(EditorSubpanel_connector, {}) {
	render() {
		const { map, selectedTimeline, selectedTimelineSteps, lockMapScrolling } = this.props;
		if (selectedTimeline == null) return null;
		return (
			<>
				<Row mlr={5}>
					<Pre>Add: </Pre>
					<Button ml={5} text="Video" enabled={selectedTimeline != null && selectedTimeline.videoID == null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						new UpdateTimeline({ id: selectedTimeline._key, updates: { videoID: '' } }).Run();
					}}/>
					<Button ml={5} text="Text" enabled={selectedTimeline != null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						const newStep = new TimelineStep({});
						new AddTimelineStep({ timelineID: selectedTimeline._key, step: newStep }).Run();
					}}/>
					<CheckBox ml="auto" text="Lock map scrolling" title="Lock map edge-scrolling. (for dragging onto timeline steps)" checked={lockMapScrolling} onChange={(val) => {
						store.dispatch(new ACTSet(a => a.main.lockMapScrolling, val));
					}}/>
				</Row>
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
					{selectedTimeline.videoID != null &&
						<Row mb={7} p="7px 10px" style={{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' }}>
							<Pre>Video ID: </Pre>
							<TextInput value={selectedTimeline.videoID} delayChangeTillDefocus={true} onChange={(val) => {
								new UpdateTimeline({ id: selectedTimeline._key, updates: { videoID: val } }).Run();
							}}/>
							<Button ml="auto" text="X" onClick={() => {
								ShowMessageBox({
									title: 'Delete video attachment', cancelButton: true,
									message: 'Remove the video attachment for this timeline?',
									onOK: () => {
										new UpdateTimeline({ id: selectedTimeline._key, updates: { videoID: null } }).Run();
									},
								});
							}}/>
						</Row>}
					{selectedTimelineSteps && selectedTimelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == selectedTimeline.steps.length - 1} map={map} timeline={selectedTimeline} step={step}/>)}
				</ScrollView>
			</>
		);
	}
}

const positionOptions = [
	{ name: 'Full', value: null },
	{ name: 'Left', value: 1 },
	{ name: 'Right', value: 2 },
	{ name: 'Center', value: 3 },
];

type StepUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, step: TimelineStep} & Partial<{}>;
@Connect((state, { map, step }: StepUIProps) => ({
}))
class StepUI extends BaseComponent<StepUIProps, {}> {
	render() {
		const { index, last, map, timeline, step } = this.props;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<Column mt={index == 0 ? 0 : 7} style={{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' }}>
				<Row p="7px 10px">
					<Pre>Step {index + 1}</Pre>
					{/* <Button ml={5} text="Edit" title="Edit this step" style={{ flexShrink: 0 }} onClick={() => {
						ShowEditTimelineStepDialog(MeID(), step);
					}}/> */}
					<Row ml="auto">
						{timeline.videoID != null &&
							<>
								<CheckBox text="Video time: " checked={step.videoTime != null} onChange={(val) => {
									if (val) {
										new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: 0 } }).Run();
									} else {
										new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: null } }).Run();
									}
								}}/>
								<TextInput mr={5} style={{ width: 60 }} delayChangeTillDefocus={true} enabled={step.videoTime != null}
									value={step.videoTime == null ? null : `${ToInt(step.videoTime / 60)}:${step.videoTime % 60}`}
									onChange={(timeStr) => {
										const parts = timeStr.split(':');
										if (parts.length != 2) return;
										const minutes = ToNumber(parts[0]);
										const seconds = ToNumber(parts[1]);
										new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: (minutes * 60) + seconds } }).Run();
									}}/>
							</>}
						{/* <Pre>Speaker: </Pre>
						<Select value={} onChange={val=> {}}/> */}
						<Pre>Position: </Pre>
						<Select options={positionOptions} value={step.groupID} onChange={(val) => {
							new UpdateTimelineStep({ stepID: step._key, stepUpdates: { groupID: val } }).Run();
						}}/>
						<Button ml={5} text="X" onClick={() => {
							ShowMessageBox({
								title: `Delete step ${index + 1}`, cancelButton: true,
								message: `
									Delete timeline step with text:

									${step.message}
								`.AsMultiline(0),
								onOK: () => {
									new DeleteTimelineStep({ stepID: step._key }).Run();
								},
							});
						}}/>
					</Row>
				</Row>
				{/* <Row ml={5} style={{ minHeight: 20 }}>{step.message}</Row> */}
				<TextArea autoSize={true} delayChangeTillDefocus={true} style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', padding: 5, outline: 'none' }}
					value={step.message}
					onChange={(val) => {
						new UpdateTimelineStep({ stepID: step._key, stepUpdates: { message: val } }).Run();
					}}/>
				<Row style={{ padding: 7, background: 'rgba(255,255,255,.2)', borderRadius: '0 0 10px 10px' }}>
					{step.nodeReveals == null &&
						'Drag nodes here to have them display when the playback reaches this step.'}
				</Row>
			</Column>
		);
	}
}
