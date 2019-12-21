import { ToJSON, Vector2i, VRect, WaitXThenRun, GetEntries, Clone } from 'js-vextensions';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Button, CheckBox, Column, Pre, Row, Select, Text, TextArea, TimeSpanInput } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM, ShallowChanged } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { DeleteTimelineStep } from 'Server/Commands/DeleteTimelineStep';
import { UpdateTimelineStep } from 'Server/Commands/UpdateTimelineStep';
import { Map } from 'Store/firebase/maps/@Map';
import { GetNodeID, GetNode } from 'Store/firebase/nodes';
import { GetNodeDisplayText, GetNodeL2, GetNodeL3 } from 'Store/firebase/nodes/$node';
import { GetNodeColor, MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { NodeReveal, TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { MeID } from 'Store/firebase/users';
import { DragInfo, MakeDraggable, Observer } from 'vwebapp-framework';
import { DraggableInfo, DroppableInfo } from 'Utils/UI/DNDStructures';
import { UUIDPathStub } from 'UI/@Shared/UUIDStub';
import { GetShortestPathFromRootToNode } from 'Utils/Store/PathFinder';
import { GetPathNodes } from 'Store/main/mapViews/$mapView';
import { GetAsync } from 'mobx-firelink';

export enum PositionOptionsEnum {
	Full = null,
	Left = 1,
	Right = 2,
	Center = 3,
}
/* export const positionOptions = [
	{ name: 'Full', value: null },
	{ name: 'Left', value: 1 },
	{ name: 'Right', value: 2 },
	{ name: 'Center', value: 3 },
]; */
export const positionOptions = GetEntries(PositionOptionsEnum);

/* let portal: HTMLElement;
WaitXThenRun(0, () => {
	portal = document.createElement('div');
	document.body.appendChild(portal);
}); */

export type StepEditorUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string} & {dragInfo?: DragInfo};

@MakeDraggable(({ index, stepID }: StepEditorUIProps) => {
	// upgrade note: make sure dnd isn't broken from having to comment the next line out
	// if (step == null) return null; // if step is not yet loaded, don't actually apply the draggable-wrapping
	return {
		type: 'TimelineStep',
		draggableInfo: new DraggableInfo({ stepID }),
		index,
		// enabled: step != null, // if step is not yet loaded, don't actually apply the draggable-wrapping
	};
})
@Observer
// @SimpleShouldUpdate({ propsToIgnore: ['dragInfo'] })
export class StepEditorUI extends BaseComponentPlus({} as StepEditorUIProps, { placeholderRect: null as VRect }) {
	/* static ValidateProps(props: StepUIProps) {
		Assert(props.step != null);
	} */

	/* shouldComponentUpdate(newProps, newState) {
		if (ShallowChanged(this.props.Excluding('dragInfo'), newProps.Excluding('dragInfo')) || ShallowChanged(this.state, newState)) return true;
		// for dragInfo, do a json-based comparison (I think this is fine?)
		if (ToJSON(this.props.dragInfo) != ToJSON(newProps.dragInfo)) return true;
		return false;
	} */

	render() {
		const { index, last, map, timeline, stepID, dragInfo } = this.props;
		const { placeholderRect } = this.state;
		const step = GetTimelineStep(stepID);
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);

		if (step == null) {
			return <div style={{ height: 100 }} {...(dragInfo && dragInfo.provided.draggableProps)} {...(dragInfo && dragInfo.provided.dragHandleProps)}/>;
		}

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
										onChange={(val) => new UpdateTimelineStep({ stepID: step._key, stepUpdates: { videoTime: val } }).Run()}/>
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
								<Column ref={(c) => { this.nodeHolder = c; provided.innerRef(GetDOM(c) as any); }} {...provided.droppableProps}
									style={E(
										{ position: 'relative', padding: 7, background: 'rgba(255,255,255,.3)', borderRadius: '0 0 10px 10px' },
										(step.nodeReveals == null || step.nodeReveals.length == 0) && { padding: '3px 5px' },
									)}>
									{(step.nodeReveals == null || step.nodeReveals.length == 0) && !dragIsOverDropArea &&
									<div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center' }}>Drag nodes here to have them display when the playback reaches this step.</div>}
									{step.nodeReveals && step.nodeReveals.map((nodeReveal, index) => {
										return <NodeRevealUI key={index} map={map} step={step} nodeReveal={nodeReveal} editing={true} index={index}/>;
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

		const siblingNodeUIs = (Array.from(this.nodeHolder.DOM.childNodes) as HTMLElement[]).filter((a) => a.classList.contains('NodeUI'));
		const siblingNodeUIInnerDOMs = siblingNodeUIs.map((nodeUI) => nodeUI.QuerySelector_BreadthFirst('.NodeUI_Inner')).filter((a) => a != null); // entry can be null if inner-ui still loading
		const firstOffsetInner = siblingNodeUIInnerDOMs.find((a) => a && a.style.transform && a.style.transform.includes('translate('));

		let placeholderRect: VRect;
		if (firstOffsetInner) {
			const firstOffsetInnerRect = VRect.FromLTWH(firstOffsetInner.getBoundingClientRect()).NewTop((top) => top - dragBoxRect.height);
			const firstOffsetInnerRect_relative = new VRect(firstOffsetInnerRect.Position.Minus(nodeHolderRect.Position), firstOffsetInnerRect.Size);

			placeholderRect = firstOffsetInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
		} else {
			if (siblingNodeUIInnerDOMs.length) {
				const lastInner = siblingNodeUIInnerDOMs.Last();
				const lastInnerRect = VRect.FromLTWH(lastInner.getBoundingClientRect()).NewTop((top) => top - dragBoxRect.height);
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

export class NodeRevealUI extends BaseComponentPlus({} as {map: Map, step: TimelineStep, nodeReveal: NodeReveal, editing: boolean, index: number}, { detailsOpen: false }) {
	render() {
		const { map, step, nodeReveal, editing, index } = this.props;
		const { detailsOpen } = this.state;

		const { path } = nodeReveal;
		const nodeID = GetNodeID(path);
		let node = GetNodeL2(nodeID);
		let nodeL3 = GetNodeL3(path);
		// if one is null, make them both null to be consistent
		if (node == null || nodeL3 == null) {
			node = null;
			nodeL3 = null;
		}

		const pathNodes = GetPathNodes(path);
		const mapNodes = pathNodes.map((a) => GetNode(a));
		// path is valid if every node in path, has the previous node as a parent
		const pathValid = mapNodes.every((node, index) => {
			const parent = mapNodes[index - 1];
			return index == 0 || (node && parent && parent.children[node._key] != null);
		});

		let displayText = node && nodeL3 ? GetNodeDisplayText(node, nodeReveal.path) : `(Node no longer exists: ${GetNodeID(nodeReveal.path)})`;
		if (!pathValid) {
			displayText = `[path invalid] ${displayText}`;
		}

		const backgroundColor = GetNodeColor(nodeL3 || { type: MapNodeType.Category } as any).desaturate(0.5).alpha(0.8);
		// if (node == null || nodeL3 == null) return null;
		return (
			<>
				<Row key={index} sel mt={index === 0 ? 0 : 5}
					style={E(
						{ width: '100%', padding: 5, background: backgroundColor.css(), borderRadius: 5, cursor: 'pointer', border: '1px solid rgba(0,0,0,.5)' },
						// selected && { background: backgroundColor.brighten(0.3).alpha(1).css() },
					)}
					onMouseDown={(e) => {
						if (e.button !== 2) return false;
						// this.SetState({ menuOpened: true });
					}}
					onClick={() => this.SetState({ detailsOpen: !detailsOpen })}
				>
					<span>{displayText}</span>
					{/* <NodeUI_Menu_Helper {...{map, node}}/> */}
					{/* <NodeUI_Menu_Stub {...{ node: nodeL3, path: `${node._key}`, inList: true }}/> */}
					{editing &&
					<Button ml="auto" text="X" style={{ margin: -3, padding: '3px 10px' }} onClick={() => {
						const newNodeReveals = step.nodeReveals.Except(nodeReveal);
						new UpdateTimelineStep({ stepID: step._key, stepUpdates: { nodeReveals: newNodeReveals } }).Run();
					}}/>}
				</Row>
				{detailsOpen &&
				<Column sel mt={5}>
					<Row>
						<Text>Path: </Text>
						<UUIDPathStub path={path}/>
						{!pathValid && editing &&
						<Button ml="auto" text="Fix path" onClick={async () => {
							const newPath = await GetAsync(() => GetShortestPathFromRootToNode(map.rootNode, node));
							const newNodeReveals = Clone(step.nodeReveals) as NodeReveal[];
							newNodeReveals[index].path = newPath;
							new UpdateTimelineStep({ stepID: step._key, stepUpdates: { nodeReveals: newNodeReveals } }).Run();
						}}/>}
					</Row>
				</Column>}
			</>
		);
	}
}
