import { Assert, CachedTransform, E, emptyArray, emptyArray_forLoading, IsNaN, nl, ToJSON, Timer } from 'js-vextensions';
import { Column } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM, GetInnerComp, RenderSource, ShallowEquals, UseCallback } from 'react-vextensions';
import { ChangeType, GetPathsToChangedDescendantNodes_WithChangeTypes } from 'Store/firebase/mapNodeEditTimes';
import { GetParentPath, HolderType } from 'Store/firebase/nodes';
import { MeID } from 'Store/firebase/users';
import { GetPlayingTimelineAppliedStepRevealNodes } from 'Store/main/maps/$map';
import { NodeChildHolder } from 'UI/@Shared/Maps/MapNode/NodeUI/NodeChildHolder';
import { NodeChildHolderBox } from 'UI/@Shared/Maps/MapNode/NodeUI/NodeChildHolderBox';
import { ExpensiveComponent, MaybeLog, ShouldLog, SlicePath, State, Watch, EB_StoreError, EB_ShowError } from 'Utils/FrameworkOverrides';
import { logTypes } from 'Utils/General/Logging';
import React, { useState, useMemo, ClassAttributes } from 'react';
import { GetSubnodesInEnabledLayersEnhanced } from '../../../../Store/firebase/layers';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { GetNodeChildrenL3, GetParentNodeL2, GetParentNodeL3, IsRootNode } from '../../../../Store/firebase/nodes';
import { GetNodeForm, IsMultiPremiseArgument, IsNodeL2, IsNodeL3, IsPremiseOfSinglePremiseArgument, IsSinglePremiseArgument, IsPremiseOfMultiPremiseArgument } from '../../../../Store/firebase/nodes/$node';
import { AccessLevel, MapNodeL3, Polarity } from '../../../../Store/firebase/nodes/@MapNode';
import { MapNodeType } from '../../../../Store/firebase/nodes/@MapNodeType';
import { GetPlayingTimeline, GetPlayingTimelineCurrentStepRevealNodes, GetPlayingTimelineRevealNodes, GetPlayingTimelineStepIndex, GetTimeFromWhichToShowChangedNodes } from '../../../../Store/main/maps/$map';
import { GetNodeView } from '../../../../Store/main/mapViews';
import { MapNodeView } from '../../../../Store/main/mapViews/@MapViews';
import { NodeChangesMarker } from './NodeUI/NodeChangesMarker';
import { NodeChildCountMarker } from './NodeUI/NodeChildCountMarker';
import { GetMeasurementInfoForNode } from './NodeUI/NodeMeasurer';
import { NodeUI_Inner } from './NodeUI_Inner';

// removed this system, since it doesn't work reliably (now that we use react-hooks, which can trigger updates that shouldComponentUpdate can't stop)
//		(a possible replacement is using StartBufferingActions() and StopBufferingActions(), however then you stop *all* ui updates, which is not what we want -- during async operations anyway)
/* const nodesLocked = {};
export function SetNodeUILocked(nodeID: string, locked: boolean, maxWait = 10000) {
	nodesLocked[nodeID] = locked;
	if (locked) {
		setTimeout(() => SetNodeUILocked(nodeID, false), maxWait);
	}
} */

// @SimpleShouldUpdate
// export class NodeUI extends BaseComponent<Props, {}, {CheckForChanges}> {
// @ExpensiveComponent({ simpleShouldUpdate_call: false })
@ExpensiveComponent
export class NodeUI extends BaseComponentPlus(
	{} as {
		indexInNodeList: number, map: Map, node: MapNodeL3, path?: string, asSubnode?: boolean, widthOverride?: number, style?,
		onHeightOrPosChange?: ()=>void
	},
	{ expectedBoxWidth: 0, expectedBoxHeight: 0, dividePoint: null as number, selfHeight: 0 },
) {
	static renderCount = 0;
	static lastRenderTime = -1;
	static ValidateProps(props) {
		const { node } = props;
		Assert(IsNodeL2(node), 'Node supplied to NodeUI is not level-2!');
		Assert(IsNodeL3(node), 'Node supplied to NodeUI is not level-3!');
	}
	static ValidateState(state) {
		const { dividePoint, selfHeight } = state;
		Assert(!IsNaN(dividePoint) && !IsNaN(selfHeight));
	}

	// for SetNodeUILocked() function above
	/* waitForUnlockTimer: Timer;
	shouldComponentUpdate(newProps, newState) {
		const changed = ShallowChanged(this.props, newProps) || ShallowChanged(this.state, newState);
		// Log('Changes: ', this.GetPropChanges());
		const { node } = this.props;
		if (!nodesLocked[node._key]) return changed;

		// node-ui is locked, so wait until it gets unlocked, then update the ui
		if (this.waitForUnlockTimer == null) {
			this.waitForUnlockTimer = new Timer(100, () => {
				if (nodesLocked[node._key]) return;
				this.waitForUnlockTimer.Stop();
				delete this.waitForUnlockTimer;
				this.Update();
			}).Start();
		}
		return false;
	} */

	nodeUI: HTMLDivElement;
	innerUI: NodeUI_Inner;
	componentDidCatch(message, info) { EB_StoreError(this, message, info); }
	render() {
		if (this.state['error']) return EB_ShowError(this.state['error']);
		let { indexInNodeList, map, node, path, asSubnode, widthOverride, style, onHeightOrPosChange, children } = this.props;
		const { expectedBoxWidth, expectedBoxHeight, dividePoint, selfHeight } = this.state;

		performance.mark('NodeUI_1');
		path = path || node._key.toString();

		const nodeChildren = GetNodeChildrenL3.Watch(node, path, true);
		let nodeChildrenToShow: MapNodeL3[] = nodeChildren.Any(a => a == null) ? emptyArray_forLoading : nodeChildren; // only pass nodeChildren when all are loaded

		let subnodes = GetSubnodesInEnabledLayersEnhanced.Watch(MeID(), map, node._key);
		subnodes = subnodes.Any(a => a == null) ? emptyArray : subnodes; // only pass subnodes when all are loaded

		const sinceTime = GetTimeFromWhichToShowChangedNodes.Watch(map._key);
		const pathsToChangedDescendantNodes_withChangeTypes = GetPathsToChangedDescendantNodes_WithChangeTypes.Watch(map._key, sinceTime, path);
		const addedDescendants = pathsToChangedDescendantNodes_withChangeTypes.filter(a => a == ChangeType.Add).length;
		const editedDescendants = pathsToChangedDescendantNodes_withChangeTypes.filter(a => a == ChangeType.Edit).length;

		const parent = GetParentNodeL3(path);
		const parentPath = GetParentPath(path);
		const parentNodeView = GetNodeView.Watch(map._key, parentPath) || new MapNodeView();

		const initialChildLimit = State.Watch(a => a.main.initialChildLimit);
		const form = GetNodeForm.Watch(node, GetParentNodeL2.Watch(path));
		const nodeView_early = GetNodeView.Watch(map._key, path) || new MapNodeView();
		const nodeView = CachedTransform('nodeView_transform1', [map._key, path], nodeView_early.Excluding('focused', 'viewOffset', 'children'), () => nodeView_early);

		const isSinglePremiseArgument = IsSinglePremiseArgument.Watch(node);
		const isMultiPremiseArgument = IsMultiPremiseArgument.Watch(node);

		const playingTimeline = GetPlayingTimeline.Watch(map._key);
		const playingTimeline_currentStepIndex = GetPlayingTimelineStepIndex.Watch(map._key);
		const playingTimelineShowableNodes = GetPlayingTimelineRevealNodes.Watch(map._key);
		const playingTimelineVisibleNodes = GetPlayingTimelineAppliedStepRevealNodes.Watch(map._key, true);
		const playingTimeline_currentStepRevealNodes = GetPlayingTimelineCurrentStepRevealNodes.Watch(map._key);

		performance.mark('NodeUI_2');
		if (ShouldLog(a => a.nodeRenders)) {
			if (logTypes.nodeRenders_for) {
				if (logTypes.nodeRenders_for == node._key) {
					Log(`Updating NodeUI (${RenderSource[this.lastRender_source]}):${node._key}`, '\nPropsChanged:', this.GetPropChanges(), '\nStateChanged:', this.GetStateChanges());
				}
			} else {
				Log(`Updating NodeUI (${RenderSource[this.lastRender_source]}):${node._key}`, '\nPropsChanged:', this.GetPropChanges().map(a => a.key), '\nStateChanged:', this.GetStateChanges().map(a => a.key));
			}
		}
		NodeUI.renderCount++;
		NodeUI.lastRenderTime = Date.now();

		/* if (node.type == MapNodeType.Argument && nodeChildren.length == 1 && MeID() == node.creator) {
			let fakeChild = AsNodeL3(AsNodeL2(new MapNode({type: MapNodeType.Claim}), new MapNodeRevision({})));
			fakeChild.premiseAddHelper = true;
			nodeChildren = [...nodeChildren, fakeChild];
		} */

		const separateChildren = node.type == MapNodeType.Claim;
		// let nodeChildren_filtered = nodeChildren;
		if (playingTimeline && playingTimeline_currentStepIndex < playingTimeline.steps.length - 1) {
			nodeChildrenToShow = nodeChildrenToShow.filter(child => playingTimelineVisibleNodes.Contains(`${path}/${child._key}`));
		}

		/* this.Stash({ nodeChildren, nodeChildrenToShow, lengthThing: nodeChildrenToShow.length }); // for debugging
		if (node._key.startsWith('wEKp')) {
			Log('NodeChildrenToShow_length:' + nodeChildrenToShow.length);
		} */

		const isPremiseOfSinglePremiseArg = IsPremiseOfSinglePremiseArgument(node, parent);
		if (isPremiseOfSinglePremiseArg) {
			var relevanceArguments = GetNodeChildrenL3(parent, SlicePath(path, 1)).filter(a => a && a.type == MapNodeType.Argument);
			// Assert(!relevanceArguments.Any(a=>a.type == MapNodeType.Claim), "Single-premise argument has more than one premise!");
		}
		/* if (IsPremiseOfMultiPremiseArgument(node, parent)) {
			widthOverride -= 20; // remove 20px, to align our right-edge with the parent argument
		} */

		const showArgumentsControlBar = (node.type == MapNodeType.Claim || isSinglePremiseArgument) && nodeView.expanded && nodeChildrenToShow != emptyArray_forLoading;

		const { width, expectedHeight } = this.GetMeasurementInfo();
		/* let innerBoxOffset = this.GetInnerBoxOffset(expectedHeight, showAddArgumentButtons, childrenCenterY);
		if (!expanded) innerBoxOffset = 0; */

		const showLimitBar = !!children; // the only type of child we ever pass into NodeUI is a LimitBar
		const argumentNode = node.type == MapNodeType.Argument ? node : isPremiseOfSinglePremiseArg ? parent : null;
		const limitBar_above = argumentNode && argumentNode.finalPolarity == Polarity.Supporting;
		const limitBarPos = showLimitBar ? (limitBar_above ? LimitBarPos.Above : LimitBarPos.Below) : LimitBarPos.None;
		// if (IsReversedArgumentNode(node)) limitBar_above = !limitBar_above;
		/* let minChildCount = GetMinChildCountToBeVisibleToNonModNonCreators(node, nodeChildren);
		let showBelowMessage = nodeChildren.length > 0 && nodeChildren.length < minChildCount; */

		// this.Stash({ dividePoint, setSelfHeight });

		// maybe temp
		const combineWithChildClaim = isSinglePremiseArgument;
		const premises = nodeChildrenToShow.filter(a => a.type == MapNodeType.Claim);
		if (combineWithChildClaim && premises.length == 1) {
			// Assert(premises.length == 1, `Single-premise argument #${node._id} has more than one premise! (${premises.map(a=>a._id).join(",")})`);

			const childLimit_up = ((nodeView || {}).childLimit_up || initialChildLimit).KeepAtLeast(initialChildLimit);
			const childLimit_down = ((nodeView || {}).childLimit_down || initialChildLimit).KeepAtLeast(initialChildLimit);
			const showAll = node._key == map.rootNode || node.type == MapNodeType.Argument;
			// return <ChildPackUI {...{map, path, childrenWidthOverride, childLimit_up, childLimit_down, showAll}} pack={pack} index={0} collection={childPacks}/>;*#/

			const index = 0;
			const direction = 'down' as any;
			const premise = premises[0];
			// if (child == null) return <div/>; // child data not loaded yet
			// let collection = nodeChildren;
			const childLimit = direction == 'down' ? childLimit_down : childLimit_up;

			// if has child-limit bar, correct its path
			const firstChildComp = this.FlattenedChildren[0] as any;
			if (firstChildComp && firstChildComp.props.path == path) {
				firstChildComp.props.path = `${firstChildComp.props.path}/${premise._key}`;
			}

			return (
				<NodeUI ref={c => this.proxyDisplayedNodeUI = c} {...this.props} key={premise._key} map={map} node={premise} path={`${path}/${premise._key}`}>
					{children}
				</NodeUI>
			);
		}

		const nodeChildHolder_direct = !isPremiseOfSinglePremiseArg && nodeView.expanded &&
			<NodeChildHolder {...{ map, node, path, nodeView, nodeChildren, nodeChildrenToShow, separateChildren, showArgumentsControlBar }}
				// type={node.type == MapNodeType.Claim && node._id != demoRootNodeID ? HolderType.Truth : null}
				type={null}
				// linkSpawnPoint={innerBoxOffset + expectedHeight / 2}
				linkSpawnPoint={dividePoint || (selfHeight / 2)}
				vertical={isMultiPremiseArgument}
				minWidth={isMultiPremiseArgument && widthOverride ? widthOverride - 20 : 0}
				onHeightOrDividePointChange={UseCallback((dividePoint) => {
					// if multi-premise argument, divide-point is always at the top (just far enough down that the self-ui can center to the point, so self-height / 2)
					if (isMultiPremiseArgument) {
						// this.SetState({dividePoint: selfHeight / 2});
						return;
					}
					this.SetState({ dividePoint });
				}, [isMultiPremiseArgument])}/>;
		const nodeChildHolderBox_truth = isPremiseOfSinglePremiseArg && nodeView.expanded &&
			<NodeChildHolderBox {...{ map, node, path, nodeView }} type={HolderType.Truth}
				widthOfNode={widthOverride || width}
				nodeChildren={nodeChildren} nodeChildrenToShow={nodeChildrenToShow}
				onHeightOrDividePointChange={UseCallback(dividePoint => this.CheckForChanges(), [])}/>;
		const nodeChildHolderBox_relevance = isPremiseOfSinglePremiseArg && nodeView.expanded &&
			<NodeChildHolderBox {...{ map, node: parent, path: parentPath, nodeView: parentNodeView }} type={HolderType.Relevance}
				widthOfNode={widthOverride || width}
				nodeChildren={GetNodeChildrenL3(parent, parentPath)} nodeChildrenToShow={relevanceArguments}
				onHeightOrDividePointChange={UseCallback(dividePoint => this.CheckForChanges(), [])}/>;

		const hasExtraWrapper = subnodes.length || isMultiPremiseArgument;

		const nodeUIResult_withoutSubnodes = (
			<div ref={c => this.nodeUI = c} className="NodeUI clickThrough"
				style={E(
					{ position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '5px 0', opacity: widthOverride != 0 ? 1 : 0 },
					style,
				)}>
				<div ref="innerBoxAndSuchHolder" className="innerBoxAndSuchHolder clickThrough" style={E(
					{ position: 'relative' },
					/* useAutoOffset && {display: "flex", height: "100%", flexDirection: "column", justifyContent: "center"},
					!useAutoOffset && {paddingTop: innerBoxOffset}, */
					// {paddingTop: innerBoxOffset},
					{ marginTop: nodeView.expanded && !isMultiPremiseArgument ? (dividePoint - (selfHeight / 2)).NaNTo(0).KeepAtLeast(0) : 0 },
				)}>
					{limitBar_above && children}
					{asSubnode &&
						<div style={{ position: 'absolute', left: 2, right: 2, top: -3, height: 3, borderRadius: '3px 3px 0 0', background: 'rgba(255,255,0,.7)' }}/>}
					<Column ref="innerBoxHolder" className="innerBoxHolder clickThrough" style={{ position: 'relative' }}>
						{node.current.accessLevel != AccessLevel.Basic &&
							<div style={{ position: 'absolute', right: 'calc(100% + 5px)', top: 0, bottom: 0, display: 'flex', fontSize: 10 }}>
								<span style={{ margin: 'auto 0' }}>{AccessLevel[node.current.accessLevel][0].toUpperCase()}</span>
							</div>}
						{nodeChildHolderBox_truth}
						<NodeUI_Inner
							ref={c => this.innerUI = GetInnerComp(c)}
							// ref={c => this.innerUI = c ? c['getDecoratedComponentInstance']() : null}
							{...{ indexInNodeList, map, node, nodeView, path, width, widthOverride }}
							style={E(
								playingTimeline_currentStepRevealNodes.Contains(path) && { boxShadow: 'rgba(255,255,0,1) 0px 0px 7px, rgb(0, 0, 0) 0px 0px 2px' },
							)}/>
						{nodeChildHolderBox_relevance}
						{/* showBelowMessage &&
							<Div ct style={{
								//whiteSpace: "normal", position: "absolute", left: 0, right: 0, top: "100%", fontSize: 12
								marginTop: 5, fontSize: 12,
								width: 0, // fixes that link-lines would have gap on left
							}}>
								Needs 2 premises to be visible.
							</Div> */}
					</Column>
					{!limitBar_above && !hasExtraWrapper && children}
				</div>

				{nodeChildrenToShow == emptyArray_forLoading &&
					<div style={{ margin: 'auto 0 auto 10px' }}>...</div>}
				{IsRootNode(node) && nodeChildrenToShow != emptyArray_forLoading && nodeChildrenToShow.length == 0 &&
					<div style={{ margin: 'auto 0 auto 10px', background: 'rgba(0,0,0,.7)', padding: 5, borderRadius: 5 }}>To add a node, right click on the root node.</div>}
				{!nodeView.expanded &&
					<NodeChildCountMarker {...{ limitBarPos }} childCount={nodeChildrenToShow.length + (relevanceArguments ? relevanceArguments.length : 0)}/>}
				{!nodeView.expanded && (addedDescendants > 0 || editedDescendants > 0) &&
					<NodeChangesMarker {...{ addedDescendants, editedDescendants, limitBarPos }}/>}
				{!isMultiPremiseArgument
					&& nodeChildHolder_direct}
			</div>
		);

		performance.mark('NodeUI_3');
		performance.measure('NodeUI_Part1', 'NodeUI_1', 'NodeUI_2');
		performance.measure('NodeUI_Part2', 'NodeUI_2', 'NodeUI_3');

		// useEffect(() => CheckForChanges());

		if (!hasExtraWrapper) {
			return nodeUIResult_withoutSubnodes;
		}
		return (
			<div className="clickThrough" style={{ display: 'flex', flexDirection: 'column' }}>
				{nodeUIResult_withoutSubnodes}
				{subnodes.map((subnode, index) => (
					<NodeUI key={index} indexInNodeList={index} map={map} node={subnode} asSubnode={true} style={E({ marginTop: -5 })}
						path={`${path}/L${subnode._key}`} widthOverride={widthOverride} onHeightOrPosChange={onHeightOrPosChange}/>
				))}
				<div className="clickThrough" style={E({ marginTop: -5 })}>
					{isMultiPremiseArgument
						&& nodeChildHolder_direct}
				</div>
				{!limitBar_above && children}
			</div>
		);
	}
	proxyDisplayedNodeUI: NodeUI;
	get NodeUIForDisplayedNode() {
		return this.proxyDisplayedNodeUI || this;
	}

	PostRender() {
		this.CheckForChanges();
	}

	// don't actually check for changes until re-rendering has stopped for 500ms
	// CheckForChanges = _.debounce(() => {
	CheckForChanges = () => {
		const { node, onHeightOrPosChange, dividePoint } = this.PropsState;

		// if (this.lastRender_source == RenderSource.SetState) return;

		// offsetHeight: How much of the parent's "relative positioning" space is taken up by the element. (ie. it ignores the element's position: absolute descendents) [we want this one]
		// clientHeight: Same as offset-height, except it excludes the element's own border, margin, and the height of its horizontal scroll-bar (if it has one).
		// scrollHeight: How much space is needed to see all of the element's content/descendents (including position: absolute ones) without scrolling.
		const height = this.DOM_HTML.offsetHeight;
		if (height != this.lastHeight) {
			MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnHeightChange NodeUI (${RenderSource[this.lastRender_source]}):${this.props.node._key}${nl}NewHeight:${height}`);

			// this.UpdateState(true);
			// this.UpdateState();
			if (onHeightOrPosChange) onHeightOrPosChange();
		}
		this.lastHeight = height;

		const selfHeight = this.SafeGet(a => a.innerUI.DOM_HTML.offsetHeight, 0);
		if (selfHeight != this.lastSelfHeight) {
			MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnSelfHeightChange NodeUI (${RenderSource[this.lastRender_source]}):${this.props.node._key}${nl}NewSelfHeight:${selfHeight}`);

			// this.UpdateState(true);
			// this.UpdateState();
			// setSelfHeight(selfHeight);
			this.SetState({ selfHeight });
			// if (onHeightOrPosChange) onHeightOrPosChange();
		}
		this.lastSelfHeight = selfHeight;

		if (dividePoint != this.lastDividePoint) {
			if (onHeightOrPosChange) onHeightOrPosChange();
		}

		/* else {
			if (this.lastRender_source == RenderSource.SetState) return;
			this.UpdateState();
			this.ReportChildrenCenterYChange();
		} */
	};

	/* ComponentDidMount() {
		const { node, userViewedNodes } = this.props;
		if (MeID() == null) return;

		const userViewedNodes_doneLoading = userViewedNodes !== undefined;
		if (userViewedNodes_doneLoading && !(userViewedNodes || {}).VKeys(true).Contains(node._key)) {
			new NotifyNodeViewed({ nodeID: node._key }).Run();
		}
	} */

	lastHeight = 0;
	lastSelfHeight = 0;
	lastDividePoint = 0;

	// GetMeasurementInfo(/*props: Props, state: State*/) {
	measurementInfo_cache;
	measurementInfo_cache_lastUsedProps;
	/* ComponentWillReceiveProps(newProps) {
		this.GetMeasurementInfo(newProps, false); // refresh measurement-info when props change
	} */
	// GetMeasurementInfo(useCached: boolean) {
	GetMeasurementInfo() {
		if (this.proxyDisplayedNodeUI) return this.proxyDisplayedNodeUI.GetMeasurementInfo();

		const { props } = this;
		const props_used = this.props.Including('map', 'node', 'path', 'subnodes', 'nodeChildren') as typeof props;
		// Log("Checking whether should remeasure info for: " + props_used.node._id);
		if (this.measurementInfo_cache && ShallowEquals(this.measurementInfo_cache_lastUsedProps, props_used)) return this.measurementInfo_cache;

		const { map, node, path } = props_used;
		const subnodes = GetSubnodesInEnabledLayersEnhanced(MeID(), map, node._key);
		let { expectedBoxWidth, width, expectedHeight } = GetMeasurementInfoForNode(node, path);

		for (const subnode of subnodes) {
			const subnodeMeasurementInfo = GetMeasurementInfoForNode(subnode, `${subnode._key}`);
			expectedBoxWidth = Math.max(expectedBoxWidth, subnodeMeasurementInfo.expectedBoxWidth);
		}

		const isMultiPremiseArgument = IsMultiPremiseArgument(node);
		if (isMultiPremiseArgument) {
			// expectedBoxWidth = expectedBoxWidth.KeepAtLeast(350);
			width = width.KeepAtLeast(350);
			// expectedBoxWidth += 20;
			width += 20; // give extra space for left-margin
		}

		this.measurementInfo_cache = { expectedBoxWidth, width/* , expectedHeight */ };
		this.measurementInfo_cache_lastUsedProps = props_used;
		return this.measurementInfo_cache;
	}
}

export enum LimitBarPos {
	Above,
	Below,
	None,
}
