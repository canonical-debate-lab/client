import { ToJSON, Vector2i, VRect, WaitXThenRun, Assert } from 'js-vextensions';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Text, Button, CheckBox, Column, Pre, Row, Select, Spinner, TextArea, TextInput, TimeSpanInput } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, GetDOM, SimpleShouldUpdate } from 'react-vextensions';
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
import { GetSelectedTimeline, GetTimelineOpenSubpanel, GetTimelinePanelOpen, TimelineSubpanel } from 'Store/main/maps/$map';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { ACTSet, Connect, DragInfo, InfoButton, MakeDraggable, State } from 'Utils/FrameworkOverrides';
import { DraggableInfo, DroppableInfo } from 'Utils/UI/DNDStructures';
import { ES } from 'Utils/UI/GlobalStyles';
import ReactList from 'react-list';

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
		// timelineSteps: timeline && GetTimelineSteps(timeline, true),
		lockMapScrolling: State(a => a.main.lockMapScrolling),
	};
};
@Connect(EditorSubpanel_connector)
export class EditorSubpanel extends BaseComponentWithConnector(EditorSubpanel_connector, {}) {
	render() {
		const { map, timeline, lockMapScrolling } = this.props;
		if (timeline == null) return null;

		const droppableInfo = new DroppableInfo({ type: 'TimelineStepList', timelineID: timeline._key });
		return (
			<>
				<Row center mlr={5}>
					<Pre>Add: </Pre>
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
					<CheckBox ml="auto" text="Lock map scrolling" title="Lock map edge-scrolling. (for dragging onto timeline steps)" checked={lockMapScrolling} onChange={(val) => {
						store.dispatch(new ACTSet(a => a.main.lockMapScrolling, val));
					}}/>
				</Row>
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({
					flex: 1, position: 'relative', padding: 7,
					// filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)', // disabled for now, since otherwise causes issue with dnd system (and portal fix causes errors here, fsr)
				})}>
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
						<Column ref={c => provided.innerRef(GetDOM(c) as any)}>
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
		const { map, timeline } = this.props;
		return <StepUI key={key} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={timeline.steps[index]}/>;
	};
}

const positionOptions = [
	{ name: 'Full', value: null },
	{ name: 'Left', value: 1 },
	{ name: 'Right', value: 2 },
	{ name: 'Center', value: 3 },
];


/* let portal: HTMLElement;
WaitXThenRun(0, () => {
	portal = document.createElement('div');
	document.body.appendChild(portal);
}); */

type StepUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string} & Partial<{step: TimelineStep}> & {dragInfo?: DragInfo};

const StepUI_connector = (state, { stepID }: StepUIProps) => {
	return {
		step: GetTimelineStep(stepID),
	};
};
@Connect(StepUI_connector)
@MakeDraggable(({ index, stepID, step }: StepUIProps) => {
	if (step == null) return null; // if step is not yet loaded, don't actually apply the draggable-wrapping
	return {
		type: 'TimelineStep',
		draggableInfo: new DraggableInfo({ stepID }),
		index,
		// enabled: step != null, // if step is not yet loaded, don't actually apply the draggable-wrapping
	};
})
// @SimpleShouldUpdate({ propsToIgnore: ['dragInfo'] })
class StepUI extends BaseComponent<StepUIProps, {placeholderRect: VRect}> {
	/* static ValidateProps(props: StepUIProps) {
		Assert(props.step != null);
	} */

	render() {
		const { index, last, map, timeline, step, dragInfo } = this.props;
		if (step == null) return <div style={{ height: 100 }} {...(dragInfo && dragInfo.provided.draggableProps)} {...(dragInfo && dragInfo.provided.dragHandleProps)}/>;
		const { placeholderRect } = this.state;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;

		const result = (
			// wrapper needed to emulate margin-top (since react-list doesn't support margins)
			<div style={{ paddingTop: index == 0 ? 0 : 7 }}>
				<Column /* mt={index == 0 ? 0 : 7} */ {...(dragInfo && dragInfo.provided.draggableProps)}
					style={E(
						{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' },
						dragInfo && dragInfo.provided.draggableProps.style,
						asDragPreview && { zIndex: 10 },
					)}>
					<Row center p="7px 10px" {...(dragInfo && dragInfo.provided.dragHandleProps)}>
						<Pre>Step {index + 1}</Pre>
						{/* <Button ml={5} text="Edit" title="Edit this step" style={{ flexShrink: 0 }} onClick={() => {
							ShowEditTimelineStepDialog(MeID(), step);
						}}/> */}
						<Row center ml="auto">
							{timeline.videoID != null &&
								<>
									<CheckBox text="Video time: " checked={step.videoTime != null} onChange={(val) => {
										if (val) {
											new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: 0 } }).Run();
										} else {
											new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: null } }).Run();
										}
									}}/>
									<TimeSpanInput mr={5} style={{ width: 60 }} enabled={step.videoTime != null} delayChangeTillDefocus={true} value={step.videoTime}
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
					<TextArea /* {...{ useCacheForDOMMeasurements: true } as any} */ autoSize={true} delayChangeTillDefocus={true} style={{ background: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)', padding: 5, outline: 'none' }}
						value={step.message}
						onChange={(val) => {
							new UpdateTimelineStep({ stepID: step._key, stepUpdates: { message: val } }).Run();
						}}/>
					<Droppable type="MapNode" droppableId={ToJSON(new DroppableInfo({ type: 'TimelineStepNodeRevealList', stepID: step._key }))}>
						{(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
							const dragIsOverDropArea = provided.placeholder.props['on'] != null;
							if (dragIsOverDropArea) {
								WaitXThenRun(0, () => this.StartGeneratingPositionedPlaceholder());
							}

							return (
								<Column ref={(c) => { this.nodeHolder = c; provided.innerRef(GetDOM(c) as any); }}
									style={E(
										{ position: 'relative', padding: 7, background: 'rgba(255,255,255,.3)', borderRadius: '0 0 10px 10px' },
										(step.nodeReveals == null || step.nodeReveals.length == 0) && { padding: '3px 5px' },
									)}>
									{(step.nodeReveals == null || step.nodeReveals.length == 0) && !dragIsOverDropArea &&
									<div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center' }}>Drag nodes here to have them display when the playback reaches this step.</div>}
									{step.nodeReveals && step.nodeReveals.map((nodeReveal, index) => {
										return <NodeRevealUI key={index} step={step} nodeReveal={nodeReveal} index={index}/>;
									})}
									{provided.placeholder}
									{dragIsOverDropArea && placeholderRect &&
										<div style={{
											// position: 'absolute', left: 0 /* placeholderRect.x */, top: placeholderRect.y, width: placeholderRect.width, height: placeholderRect.height,
											position: 'absolute', left: 7 /* placeholderRect.x */, top: placeholderRect.y, right: 7, height: placeholderRect.height,
											border: '1px dashed rgba(255,255,255,1)', borderRadius: 5,
										}}/>}
								</Column>
							);
						}}
					</Droppable>
				</Column>
			</div>
		);

		// if drag preview, we have to put in portal, since otherwise the "filter" effect of ancestors causes the {position:fixed} style to not be relative-to-page
		/* if (asDragPreview) {
			return ReactDOM.createPortal(result, portal);
		} */
		return result;
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
		const siblingNodeUIInnerDOMs = siblingNodeUIs.map(nodeUI => nodeUI.QuerySelector_BreadthFirst('.NodeUI_Inner')).filter(a => a != null); // entry can be null if inner-ui still loading
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
	let node = GetNodeL2(GetNodeID(nodeReveal.path));
	let nodeL3 = GetNodeL3(nodeReveal.path);
	// if one is null, make them both null to be consistent
	if (node == null || nodeL3 == null) {
		node = null;
		nodeL3 = null;
	}

	return {
		node,
		nodeL3,
		displayText: node && nodeL3 ? GetNodeDisplayText(node, nodeReveal.path) : `(Node no longer exists: ${GetNodeID(nodeReveal.path)})`,
	};
};
@Connect(connector)
export class NodeRevealUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { step, nodeReveal, index, node, nodeL3, displayText } = this.props;
		// if (node == null || nodeL3 == null) return null;

		const path = nodeReveal.path;
		const backgroundColor = GetNodeColor(nodeL3 || { type: MapNodeType.Category } as any).desaturate(0.5).alpha(0.8);
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
