import { Button, Row, Column, Pre, CheckBox, TextInput, TextArea, Select, Spinner } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponent, GetDOM } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { AddTimelineStep } from 'Server/Commands/AddTimelineStep';
import { TimelineStep, NodeReveal } from 'Store/firebase/timelineSteps/@TimelineStep';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { ES } from 'Utils/UI/GlobalStyles';
import { Connect, State, ACTSet, InfoButton } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { MeID } from 'Store/firebase/users';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { ShowEditTimelineStepDialog } from 'UI/@Shared/Timelines/Steps/TimelineStepDetailsUI';
import { DeleteTimelineStep } from 'Server/Commands/DeleteTimelineStep';
import { GetTimelineSteps } from 'Store/firebase/timelines';
import { GetSelectedTimeline, GetTimelineOpenSubpanel, TimelineSubpanel, GetTimelinePanelOpen } from 'Store/main/maps/$map';
import { UpdateTimelineStep } from 'Server/Commands/UpdateTimelineStep';
import { UpdateTimeline } from 'Server/Commands/UpdateTimeline';
import { Global, ToInt, ToNumber, ToJSON, WaitXThenRun, VRect, Vector2i } from 'js-vextensions';
import { GetOpenMapID } from 'Store/main';
import { ShowMessageBox } from 'react-vmessagebox';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { MinuteSecondInput } from 'Utils/ReactComponents/MinuteSecondInput';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { DroppableInfo } from 'Utils/UI/DNDStructures';
import { GetNodeColor } from 'Store/firebase/nodes/@MapNodeType';
import { GetNodeL3, GetNodeDisplayText, GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetNode, GetNodeID } from 'Store/firebase/nodes';

// for use by react-beautiful-dnd (using text replacement)
G({ LockMapEdgeScrolling });
function LockMapEdgeScrolling() {
	const mapID = GetOpenMapID();
	return State(a => a.main.lockMapScrolling) && GetTimelinePanelOpen(mapID) && GetTimelineOpenSubpanel(mapID) == TimelineSubpanel.Editor;
}

const EditorSubpanel_connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		timeline,
		timelineSteps: timeline && GetTimelineSteps(timeline),
		lockMapScrolling: State(a => a.main.lockMapScrolling),
	};
};
@Connect(EditorSubpanel_connector)
export class EditorSubpanel extends BaseComponentWithConnector(EditorSubpanel_connector, {}) {
	render() {
		const { map, timeline, timelineSteps, lockMapScrolling } = this.props;
		if (timeline == null) return null;
		return (
			<>
				<Row mlr={5}>
					<Pre>Add: </Pre>
					<Button ml={5} text="Video" enabled={timeline != null && timeline.videoID == null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						new UpdateTimeline({ id: timeline._key, updates: { videoID: '' } }).Run();
					}}/>
					<Button ml={5} text="Statement" enabled={timeline != null} onClick={() => {
						if (MeID() == null) return ShowSignInPopup();
						const newStep = new TimelineStep({});
						new AddTimelineStep({ timelineID: timeline._key, step: newStep }).Run();
					}}/>
					<CheckBox ml="auto" text="Lock map scrolling" title="Lock map edge-scrolling. (for dragging onto timeline steps)" checked={lockMapScrolling} onChange={(val) => {
						store.dispatch(new ACTSet(a => a.main.lockMapScrolling, val));
					}}/>
				</Row>
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
					{timeline.videoID != null &&
						<Row mb={7} p="7px 10px" style={{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' }}>
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
							<MinuteSecondInput mr={5} style={{ width: 60 }} enabled={timeline.videoStartTime != null} value={timeline.videoStartTime}
								onChange={val => new UpdateTimeline({ id: timeline._key, updates: { videoStartTime: val } }).Run()}/>
							<Pre>Height<InfoButton text={`
								The height, as a percentage of the width.

								4:3 = 75%
								16:9 = 56.25%
							`.AsMultiline(0)}/>: </Pre>
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
					{timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>)}
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
class StepUI extends BaseComponent<StepUIProps, {placeholderRect: VRect}> {
	render() {
		const { index, last, map, timeline, step } = this.props;
		const { placeholderRect } = this.state;
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
								<MinuteSecondInput mr={5} style={{ width: 60 }} enabled={step.videoTime != null} value={step.videoTime}
									onChange={val => new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: val } }).Run()}/>
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
				<Droppable type="MapNode" droppableId={ToJSON(new DroppableInfo({ type: 'TimelineStep', stepID: step._key }))}>{(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
					<Column ref={(c) => { this.nodeHolder = c; provided.innerRef(GetDOM(c) as any); }} style={{ position: 'relative', padding: 7, background: 'rgba(255,255,255,.2)', borderRadius: '0 0 10px 10px' }}>
						{(step.nodeReveals == null || step.nodeReveals.length == 0) && provided.placeholder == null &&
							<div>Drag nodes here to have them display when the playback reaches this step.</div>}
						{step.nodeReveals && step.nodeReveals.map((nodeReveal, index) => {
							return <NodeRevealUI key={index} step={step} nodeReveal={nodeReveal} index={index}/>;
						})}
						{provided.placeholder}
						{provided.placeholder && void WaitXThenRun(0, () => this.StartGeneratingPositionedPlaceholder())}
						{provided.placeholder && placeholderRect &&
							<div style={{
								// position: 'absolute', left: 0 /* placeholderRect.x */, top: placeholderRect.y, width: placeholderRect.width, height: placeholderRect.height,
								position: 'absolute', left: 7 /* placeholderRect.x */, top: placeholderRect.y, right: 7, height: placeholderRect.height,
								border: '1px dashed rgba(255,255,255,1)', borderRadius: 5,
							}}/>}
					</Column>
				)}</Droppable>
			</Column>
		);
	}
	nodeHolder: Row;

	StartGeneratingPositionedPlaceholder() {
		if (this.nodeHolder == null || !this.nodeHolder.mounted) {
			// call again in a second, once node-holder is initialized
			WaitXThenRun(0, () => this.StartGeneratingPositionedPlaceholder());
			return;
		}

		const nodeHolderRect = VRect.FromLTWH(this.nodeHolder.DOM.getBoundingClientRect());
		const dragBox = document.querySelector('.NodeUI_Inner.DragPreview');
		if (dragBox == null) return; // this can happen at end of drag
		const dragBoxRect = VRect.FromLTWH(dragBox.getBoundingClientRect());

		const siblingNodeUIs = (this.nodeHolder.DOM.childNodes.ToArray() as HTMLElement[]).filter(a => a.classList.contains('NodeUI'));
		const siblingNodeUIInnerDOMs = siblingNodeUIs.map(nodeUI => nodeUI.QuerySelector_BreadthFirst('.NodeUI_Inner'));
		const firstOffsetInner = siblingNodeUIInnerDOMs.find(a => a && a.style.transform && a.style.transform.includes('translate('));

		let placeholderRect: VRect;
		if (firstOffsetInner) {
			const firstOffsetInnerRect = VRect.FromLTWH(firstOffsetInner.getBoundingClientRect()).NewTop(top => top - dragBoxRect.height);
			const firstOffsetInnerRect_relative = new VRect(firstOffsetInnerRect.Position.Minus(nodeHolderRect.Position), firstOffsetInnerRect.Size);

			placeholderRect = firstOffsetInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
		} else {
			if (siblingNodeUIInnerDOMs.length) {
				const lastInner = siblingNodeUIInnerDOMs.Last();
				const lastInnerRect = VRect.FromLTWH(lastInner.getBoundingClientRect()).NewTop(top => top - dragBoxRect.height);
				const lastInnerRect_relative = new VRect(lastInnerRect.Position.Minus(nodeHolderRect.Position), lastInnerRect.Size);

				placeholderRect = lastInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
				// if (dragBoxRect.Center.y > firstOffsetInnerRect.Center.y) {
				placeholderRect.y += lastInnerRect.height;
			} else {
				// placeholderRect = new VRect(Vector2i.zero, dragBoxRect.Size);
				placeholderRect = new VRect(new Vector2i(7, 7), dragBoxRect.Size); // adjust for padding
			}
		}

		this.SetState({ placeholderRect });
	}
}

const connector = (state, { nodeReveal }: {step: TimelineStep, nodeReveal: NodeReveal, index: number}) => {
	const node = GetNodeL2(GetNodeID(nodeReveal.path));
	const nodeL3 = GetNodeL3(nodeReveal.path);
	return {
		node,
		nodeL3,
		displayText: node && nodeL3 && GetNodeDisplayText(node, nodeReveal.path),
	};
};
@Connect(connector)
export class NodeRevealUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { step, nodeReveal, index, node, nodeL3, displayText } = this.props;
		if (node == null || nodeL3 == null) return null;

		const path = nodeReveal.path;
		const backgroundColor = GetNodeColor(nodeL3).desaturate(0.5).alpha(0.8);
		return (
			<Row key={index} mt={index === 0 ? 0 : 5}
				style={E(
					{ width: '100%', padding: 5, background: backgroundColor.css(), borderRadius: 5, /* cursor: 'pointer', */ border: '1px solid rgba(0,0,0,.5)' },
					// selected && { background: backgroundColor.brighten(0.3).alpha(1).css() },
				)}
				onMouseDown={(e) => {
					if (e.button !== 2) return false;
					// this.SetState({ menuOpened: true });
				}}>
				<span>{displayText}</span>
				{/* <NodeUI_Menu_Helper {...{map, node}}/> */}
				{/* <NodeUI_Menu_Stub {...{ node: nodeL3, path: `${node._key}`, inList: true }}/> */}
				<Button ml="auto" text="X" style={{ margin: -3, padding: '3px 10px' }} onClick={() => {
					const newNodeReveals = step.nodeReveals.Except(nodeReveal);
					new UpdateTimelineStep({ stepID: step._key, stepUpdates: { nodeReveals: newNodeReveals } }).Run();
				}}/>
			</Row>
		);
	}
}
