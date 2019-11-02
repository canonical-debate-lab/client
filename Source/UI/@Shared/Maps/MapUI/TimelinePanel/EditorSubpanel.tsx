import { ToJSON, Vector2i, VRect, WaitXThenRun, Assert, GetEntries } from 'js-vextensions';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Text, Button, CheckBox, Column, Pre, Row, Select, Spinner, TextArea, TextInput, TimeSpanInput } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, GetDOM, SimpleShouldUpdate, BaseComponentPlus } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { ScrollView } from 'react-vscrollview';
import { AddTimelineStep } from 'Server/Commands/AddTimelineStep';
import { DeleteTimelineStep } from 'Server/Commands/DeleteTimelineStep';
import { UpdateTimeline } from 'Server/Commands/UpdateTimeline';
import { UpdateTimelineStep } from 'Server/Commands/UpdateTimelineStep';
import { Map } from 'Store/firebase/maps/@Map';
import { GetNodeID } from 'Store/firebase/nodes';
import { GetNodeDisplayText, GetNodeL2, GetNodeL3 } from 'Store/firebase/nodes/$node';
import { GetNodeColor, MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { GetTimelineSteps, GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { NodeReveal, TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { MeID } from 'Store/firebase/users';
import { GetOpenMapID } from 'Store/main';
import { GetSelectedTimeline, GetTimelineOpenSubpanel, GetTimelinePanelOpen, TimelineSubpanel, GetShowTimelineDetails, ACTMap_TimelineShowDetailsSet } from 'Store/main/maps/$map';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { ACTSet, Connect, DragInfo, InfoButton, MakeDraggable, State, Watch } from 'Utils/FrameworkOverrides';
import { DraggableInfo, DroppableInfo } from 'Utils/UI/DNDStructures';
import { ES } from 'Utils/UI/GlobalStyles';
import ReactList from 'react-list';
import { TimelineDetailsUI, TimelineDetailsEditor } from 'UI/@Shared/Timelines/TimelineDetailsUI';
import { StepEditorUI } from './EditorSubpanel/StepEditorUI';

// for use by react-beautiful-dnd (using text replacement)
G({ LockMapEdgeScrolling });
function LockMapEdgeScrolling() {
	const mapID = GetOpenMapID();
	return State(a => a.main.lockMapScrolling) && GetTimelinePanelOpen(mapID) && GetTimelineOpenSubpanel(mapID) == TimelineSubpanel.Editor;
}

export class EditorSubpanel extends BaseComponentPlus({} as {map: Map}, {}, {} as {timeline: Timeline}) {
	render() {
		const { map } = this.props;
		const timeline = GetSelectedTimeline.Watch(map && map._key);
		// timelineSteps: timeline && GetTimelineSteps(timeline, true),
		const showTimelineDetails = GetShowTimelineDetails.Watch(map && map._key);
		const lockMapScrolling = State.Watch(a => a.main.lockMapScrolling);
		const droppableInfo = new DroppableInfo({ type: 'TimelineStepList', timelineID: timeline ? timeline._key : null });

		this.Stash({ timeline });
		if (timeline == null) return null;
		return (
			<>
				<Row center mlr={5}>
					<Text>Add: </Text>
					<Button ml={5} text="Video" enabled={timeline != null && timeline.videoID == null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						new UpdateTimeline({ id: timeline._key, updates: { videoID: '' } }).Run();
					}}/>
					<Button ml={5} text="Statement" enabled={timeline != null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						const lastVisibleStepIndex = this.stepList.getVisibleRange()[1];
						const newStepIndex = lastVisibleStepIndex == timeline.steps.length - 1 ? null : lastVisibleStepIndex;

						const newStep = new TimelineStep({});
						new AddTimelineStep({ timelineID: timeline._key, step: newStep, stepIndex: newStepIndex }).Run();
					}}/>
					<CheckBox ml={5} text="Details" checked={showTimelineDetails} onChange={(val) => {
						store.dispatch(new ACTMap_TimelineShowDetailsSet({ mapID: map._key, showDetails: val }));
					}}/>
					<CheckBox ml="auto" text="Lock map scrolling" title="Lock map edge-scrolling. (for dragging onto timeline steps)" checked={lockMapScrolling} onChange={(val) => {
						store.dispatch(new ACTSet(a => a.main.lockMapScrolling, val));
					}}/>
				</Row>
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({
					flex: 1, position: 'relative', padding: 7,
					// filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)', // disabled for now, since otherwise causes issue with dnd system (and portal fix causes errors here, fsr)
				})}>
					{showTimelineDetails &&
					<TimelineDetailsEditor timeline={timeline}/>}
					{timeline.videoID != null &&
					<Row center mb={7} p="7px 10px" style={{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' }}>
						<Pre>Video ID: </Pre>
						<TextInput value={timeline.videoID} delayChangeTillDefocus={true} onChange={(val) => {
							new UpdateTimeline({ id: timeline._key, updates: { videoID: val } }).Run();
						}}/>
						<CheckBox ml={5} text="Start: " checked={timeline.videoStartTime != null} onChange={(val) => {
							if (val) {
								new UpdateTimeline({ id: timeline._key, updates: { videoStartTime: 0 } }).Run();
							} else {
								new UpdateTimeline({ id: timeline._key, updates: { videoStartTime: null } }).Run();
							}
						}}/>
						<TimeSpanInput mr={5} style={{ width: 60 }} enabled={timeline.videoStartTime != null} delayChangeTillDefocus={true} value={timeline.videoStartTime}
							onChange={val => new UpdateTimeline({ id: timeline._key, updates: { videoStartTime: val } }).Run()}/>
						<Row center>
							<Text>Height</Text>
							<InfoButton text={`
								The height, as a percentage of the width.

								4:3 = 75%
								16:9 = 56.25%
							`.AsMultiline(0)}/>
							<Text>: </Text>
						</Row>
						<Spinner min={0} max={100} step={0.01} delayChangeTillDefocus={true} style={{ width: 62 }} value={(timeline.videoHeightVSWidthPercent * 100).RoundTo(0.01)} onChange={(val) => {
							new UpdateTimeline({ id: timeline._key, updates: { videoHeightVSWidthPercent: (val / 100).RoundTo(0.0001) } }).Run();
						}}/>
						<Pre>%</Pre>
						<Button ml="auto" text="X" onClick={() => {
							ShowMessageBox({
								title: 'Delete video attachment', cancelButton: true,
								message: 'Remove the video attachment for this timeline?',
								onOK: () => {
									new UpdateTimeline({ id: timeline._key, updates: { videoID: null } }).Run();
								},
							});
						}}/>
					</Row>}
					<Droppable type="TimelineStep" droppableId={ToJSON(droppableInfo.VSet({ timelineID: timeline._key }))}>{(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
						<Column ref={c => provided.innerRef(GetDOM(c) as any)} {...provided.droppableProps}>
							{/* timelineSteps && timelineSteps.map((step, index) => {
								if (step == null) return null;
								return <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>;
							}) */}
							<ReactList ref={c => this.stepList = c} type='variable' length={timeline.steps.length} itemSizeEstimator={this.EstimateStepHeight} itemRenderer={this.RenderStep}/>
						</Column>
					)}</Droppable>
				</ScrollView>
			</>
		);
	}
	stepList: ReactList;

	EstimateStepHeight = (index: number, cache: any) => {
		return 100;
	};
	RenderStep = (index: number, key: any) => {
		const { map, timeline } = this.PropsStash;
		const stepID = timeline.steps[index];
		return <StepEditorUI key={stepID} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={stepID}/>;
	};
}
