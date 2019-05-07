import { Button, Row, Column, Pre, CheckBox, TextInput } from 'react-vcomponents';
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
import { Global } from 'js-vextensions';
import { GetOpenMapID } from 'Store/main';

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
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', maxHeight: 500, borderRadius: '0 0 10px 10px' })}>
					{selectedTimeline.videoID != null &&
						<>
							<Pre>Video ID: </Pre>
							<TextInput value={selectedTimeline.videoID} delayChangeTillDefocus={true} onChange={(val) => {
								new UpdateTimeline({ id: selectedTimeline._key, updates: { videoID: val } }).Run();
							}}/>
							<Button text="X" onClick={() => {
								new UpdateTimeline({ id: selectedTimeline._key, updates: { videoID: null } }).Run();
							}}/>
						</>}
					{selectedTimelineSteps && selectedTimelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == selectedTimeline.steps.length - 1} map={map} step={step}/>)}
				</ScrollView>
			</>
		);
	}
}

type StepUIProps = {index: number, last: boolean, map: Map, step: TimelineStep} & Partial<{}>;
@Connect((state, { map, step }: StepUIProps) => ({
}))
class StepUI extends BaseComponent<StepUIProps, {}> {
	render() {
		const { index, last, map, step } = this.props;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<Column p="7px 10px" style={E(
				{
					// background: index % 2 == 0 ? "rgba(30,30,30,.7)" : "rgba(0,0,0,.7)",
					background: 'rgba(0,0,0,.7)',
					borderTop: '1px solid rgba(255,255,255,.3)',
				},
				last && { borderRadius: '0 0 10px 10px' },
			)}>
				<Row>
					<Row style={{ flexShrink: 0 }}>Step {index + 1}:</Row>
					<Row ml={5}>{step.message}</Row>
					<Button ml={5} text="Edit" title="Edit this step" style={{ flexShrink: 0 }} onClick={() => {
						ShowEditTimelineStepDialog(MeID(), step);
					}}/>
					<Button ml={5} text="X" onClick={() => {
						new DeleteTimelineStep({ stepID: step._key }).Run();
					}}/>
				</Row>
			</Column>
		);
	}
}
