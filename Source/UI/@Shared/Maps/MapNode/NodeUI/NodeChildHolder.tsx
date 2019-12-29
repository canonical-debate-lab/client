import { Assert, emptyObj, nl, ToJSON, Vector2i, VRect, WaitXThenRun, E } from 'js-vextensions';
import * as React from 'react';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { Button, Column, Div, Row } from 'react-vcomponents';
import { BaseComponentPlus, BaseComponentWithConnector, GetDOM, RenderSource, WarnOfTransientObjectProps } from 'react-vextensions';
import { GetFillPercent_AtPath } from 'Store/firebase/nodeRatings';
import { GetNodeChildrenL3, HolderType } from 'Store/firebase/nodes';
import { MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { ArgumentType } from 'Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType, MapNodeType_Info } from 'Store/firebase/nodes/@MapNodeType';
import { NodeConnectorBackground } from 'UI/@Shared/Maps/MapNode/NodeConnectorBackground';
import { NodeUI } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { Icon, IsSpecialEmptyArray, MaybeLog, Observer } from 'vwebapp-framework';
import { DroppableInfo } from 'Utils/UI/DNDStructures';
import { ES } from 'Utils/UI/GlobalStyles';
import { store } from 'Store';
import { GetNodeView } from 'Store/main/maps/mapViews/$mapView';
import { runInAction } from 'mobx';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { IsMultiPremiseArgument } from '../../../../../Store/firebase/nodes/$node';
import { Polarity } from '../../../../../Store/firebase/nodes/@MapNode';
import { ArgumentsControlBar } from '../ArgumentsControlBar';
import { NodeChildHolderBox } from './NodeChildHolderBox';

type Props = {
	map: Map, node: MapNodeL3, path: string, nodeChildrenToShow: MapNodeL3[], type: HolderType,
	separateChildren: boolean, showArgumentsControlBar: boolean, linkSpawnPoint: number, vertical?: boolean, minWidth?: number,
	onHeightOrDividePointChange?: (dividePoint: number)=>void,
};
const initialState = {
	childrenWidthOverride: null as number,
	oldChildBoxOffsets: null as {[key: number]: Vector2i},
	placeholderRect: null as VRect,
};

@WarnOfTransientObjectProps
@Observer
export class NodeChildHolder extends BaseComponentPlus({ minWidth: 0 } as Props, initialState, {} as {nodeChildren_fillPercents: {[key: string]: number}}) {
	/* static ValidateProps(props) {
		let {node, path} = props;
		//Assert(SplitStringBySlash_Cached(path).Distinct().length == SplitStringBySlash_Cached(path).length, `Node path contains a circular link! (${path})`);
	} */

	childBoxes: {[key: number]: NodeUI} = {};
	render() {
		const { map, node, path, nodeChildrenToShow, type, separateChildren, showArgumentsControlBar, linkSpawnPoint, vertical, minWidth, onHeightOrDividePointChange } = this.props;
		let { childrenWidthOverride, oldChildBoxOffsets, placeholderRect } = this.state;
		childrenWidthOverride = (childrenWidthOverride | 0).KeepAtLeast(minWidth);

		const nodeView = GetNodeView(map._key, path);
		const nodeChildren_fillPercents = IsSpecialEmptyArray(nodeChildrenToShow) ? emptyObj : nodeChildrenToShow.filter((a) => a).ToMap((child) => `${child._key}`, (child) => {
			return GetFillPercent_AtPath(child, `${path}/${child._key}`);
		});
		this.Stash({ nodeChildren_fillPercents });

		const initialChildLimit = store.main.maps.initialChildLimit;
		const currentNodeBeingAdded_path = store.main.maps.currentNodeBeingAdded_path;

		let nodeChildrenToShowHere = nodeChildrenToShow;
		let nodeChildrenToShowInRelevanceBox;
		if (IsMultiPremiseArgument(node) && type != HolderType.Relevance) {
			nodeChildrenToShowHere = nodeChildrenToShow.filter((a) => a && a.type != MapNodeType.Argument);
			nodeChildrenToShowInRelevanceBox = nodeChildrenToShow.filter((a) => a && a.type == MapNodeType.Argument);
		}

		let upChildren = separateChildren ? nodeChildrenToShowHere.filter((a) => a.finalPolarity == Polarity.Supporting) : [];
		let downChildren = separateChildren ? nodeChildrenToShowHere.filter((a) => a.finalPolarity == Polarity.Opposing) : [];

		// apply sorting (regardless of direction, both are ordered by score/priority; "up" reordering is applied on the *child-ui list*, not the child-node list)
		if (separateChildren) {
			upChildren = upChildren.OrderByDescending((child) => nodeChildren_fillPercents[child._key]);
			downChildren = downChildren.OrderByDescending((child) => nodeChildren_fillPercents[child._key]);
		} else {
			nodeChildrenToShowHere = nodeChildrenToShowHere.OrderByDescending((child) => nodeChildren_fillPercents[child._key]);
			// if (IsArgumentNode(node)) {
			const isArgument_any = node.type == MapNodeType.Argument && node.current.argumentType == ArgumentType.Any;
			if (node.childrenOrder && !isArgument_any) {
				nodeChildrenToShowHere = nodeChildrenToShowHere.OrderBy((child) => node.childrenOrder.indexOf(child._key).IfN1Then(Number.MAX_SAFE_INTEGER));
			}
		}

		let childLimit_up = ((nodeView || {}).childLimit_up || initialChildLimit).KeepAtLeast(initialChildLimit);
		let childLimit_down = ((nodeView || {}).childLimit_down || initialChildLimit).KeepAtLeast(initialChildLimit);
		// if the map's root node, or an argument node, show all children
		const showAll = node._key == map.rootNode || node.type == MapNodeType.Argument;
		if (showAll) [childLimit_up, childLimit_down] = [100, 100];

		const RenderChild = (child: MapNodeL3, index: number, collection, direction = 'down' as 'up' | 'down') => {
			/* if (pack.node.premiseAddHelper) {
				return <PremiseAddHelper mapID={map._id} parentNode={node} parentPath={path}/>;
			} */

			const childLimit = direction == 'down' ? childLimit_down : childLimit_up;
			// const isFarthestChildFromDivider = index == (direction == 'down' ? childLimit - 1 : 0);
			const isFarthestChildFromDivider = index == childLimit - 1;
			return (
				// <ErrorBoundary errorUI={props=>props.defaultUI(E(props, {style: {width: 500, height: 300}}))}>
				// <ErrorBoundary key={child._key} errorUIStyle={{ width: 500, height: 300 }}>
				<NodeUI key={child._key} ref={(c) => this.childBoxes[child._key] = c} indexInNodeList={index} map={map} node={child}
					path={`${path}/${child._key}`} widthOverride={childrenWidthOverride} onHeightOrPosChange={this.OnChildHeightOrPosChange}>
					{isFarthestChildFromDivider && !showAll && (collection.length > childLimit || childLimit != initialChildLimit) &&
						<ChildLimitBar {...{ map, path, childrenWidthOverride, childLimit }} direction={direction} childCount={collection.length}/>}
				</NodeUI>
			);
		};

		const RenderGroup = (group: 'all' | 'up' | 'down') => {
			const direction = group == 'up' ? 'up' : 'down';
			const refName = `${group}ChildHolder`;
			const childLimit = group == 'up' ? childLimit_up : childLimit_down; // "all" and "down" share a child-limit
			const childrenHere = group == 'all' ? nodeChildrenToShowHere : group == 'up' ? upChildren : downChildren;
			// if direction is up, we need to have the first-in-children-array/highest-fill-percent entries show at the *bottom*, so reverse the children-here array
			if (direction == 'up') childrenHere.reverse();
			const childrenHereUIs = childrenHere.slice(0, childLimit).map((pack, index) => {
				return RenderChild(pack, index, childrenHere, direction);
			});
			// if direction is up, we need to have the first-in-children-array/highest-fill-percent entries show at the *bottom*, so reverse the children-uis array
			// if (direction == 'up') childrenHereUIs.reverse();

			const dragBox = document.querySelector('.NodeUI_Inner.DragPreview');
			const dragBoxRect = dragBox && VRect.FromLTWH(dragBox.getBoundingClientRect());

			return (
				<Droppable type="MapNode" droppableId={ToJSON(droppableInfo.VSet({ subtype: group, childIDs: childrenHere.map((a) => a._key) }))} /* renderClone={(provided, snapshot, descriptor) => {
					const index = descriptor.index;
					const pack = childrenHere.slice(0, childLimit)[index];
					return RenderChild(pack, index, childrenHere);
				}} */>
					{(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
						const dragIsOverDropArea = provided.placeholder.props['on'] != null;
						if (dragIsOverDropArea) {
							WaitXThenRun(0, () => this.StartGeneratingPositionedPlaceholder(group));
						}

						return (
							<Column ref={(c) => { this[`${group}ChildHolder`] = c; provided.innerRef(GetDOM(c) as any); }} ct className={refName} {...provided.droppableProps}
								style={E(
									{ position: 'relative' },
									childrenHere.length == 0 && { position: 'absolute', top: group == 'down' ? '100%' : 0, width: MapNodeType_Info.for[MapNodeType.Claim].minWidth, height: 100 },
								)}>
								{/* childrenHere.length == 0 && <div style={{ position: 'absolute', top: '100%', width: '100%', height: 200 }}/> */}
								{childrenHereUIs}
								{provided.placeholder}
								{dragIsOverDropArea && placeholderRect &&
									<div style={{
										position: 'absolute', left: 0 /* placeholderRect.x */, top: placeholderRect.y, width: childrenWidthOverride || placeholderRect.width, height: placeholderRect.height,
										border: '1px dashed rgba(255,255,255,1)', borderRadius: 5,
									}}/>}
							</Column>
						);
					}}
				</Droppable>
			);
		};

		const droppableInfo = new DroppableInfo({ type: 'NodeChildHolder', parentPath: path });
		this.childBoxes = {};
		return (
			<Column ref={(c) => this.childHolder = c} className="childHolder clickThrough" style={E(
				{
					position: 'relative', // needed so position:absolute in RenderGroup takes into account NodeUI padding
					// marginLeft: vertical ? 20 : (nodeChildrenToShow.length || showArgumentsControlBar) ? 30 : 0,
					marginLeft: vertical ? 20 : 30,
					// display: "flex", flexDirection: "column", marginLeft: 10, maxHeight: expanded ? 500 : 0, transition: "max-height 1s", overflow: "hidden",
				},
				//! expanded && {visibility: "hidden", height: 0}, // maybe temp; fix for lines-sticking-to-top issue
				// if we don't know our child offsets yet, render still (so we can measure ourself), but make self invisible
				oldChildBoxOffsets == null && { opacity: 0, pointerEvents: 'none' },
			)}>
				{linkSpawnPoint > 0 && oldChildBoxOffsets &&
					// <NodeConnectorBackground node={node} linkSpawnPoint={vertical ? Vector2iCache.Get(0, linkSpawnPoint) : Vector2iCache.Get(-30, linkSpawnPoint)}
					<NodeConnectorBackground node={node} linkSpawnPoint={vertical ? new Vector2i(-10, 0) : new Vector2i(-30, linkSpawnPoint)} straightLines={vertical}
						shouldUpdate={true} // this.lastRender_source == RenderSource.SetState}
						nodeChildren={nodeChildrenToShowHere} childBoxOffsets={oldChildBoxOffsets}/>}

				{/* if we're for multi-premise arg, and this comp is not already showing relevance-args, show them in a "Taken together, are these claims relevant?" box */}
				{IsMultiPremiseArgument(node) && type != HolderType.Relevance &&
					<NodeChildHolderBox {...{ map, node, path }} type={HolderType.Relevance} widthOverride={childrenWidthOverride}
						widthOfNode={childrenWidthOverride}
						nodeChildren={GetNodeChildrenL3(node, path)} nodeChildrenToShow={nodeChildrenToShowInRelevanceBox}
						onHeightOrDividePointChange={(dividePoint) => this.CheckForLocalChanges()}/>}
				{!separateChildren &&
					RenderGroup('all')}
				{separateChildren &&
					RenderGroup('up')}
				{showArgumentsControlBar &&
					<ArgumentsControlBar ref={(c) => this.argumentsControlBar = c} map={map} node={node} path={path} childBeingAdded={currentNodeBeingAdded_path == `${path}/?`}/>}
				{separateChildren &&
					RenderGroup('down')}
			</Column>
		);
	}
	childHolder: Column;
	allChildHolder: Column;
	upChildHolder: Column;
	downChildHolder: Column;
	argumentsControlBar: ArgumentsControlBar;

	StartGeneratingPositionedPlaceholder(group: 'all' | 'up' | 'down') {
		const groups = { all: this.allChildHolder, up: this.upChildHolder, down: this.downChildHolder };
		const childHolder = groups[group];
		if (childHolder == null || !childHolder.mounted) {
			// call again in a second, once child-holder is initialized
			WaitXThenRun(0, () => this.StartGeneratingPositionedPlaceholder(group));
			return;
		}

		const childHolderRect = VRect.FromLTWH(childHolder.DOM.getBoundingClientRect());
		/* const match = firstOffsetInner.style.transform.match(/([0-9]+).+?([0-9]+)/);
		const dragBoxSize = new Vector2i(match[1].ToInt(), match[2].ToInt());
		// delete dragInfo.provided.draggableProps.style.transform; */
		const dragBox = document.querySelector('.NodeUI_Inner.DragPreview');
		if (dragBox == null) return; // this can happen at end of drag
		const dragBoxRect = VRect.FromLTWH(dragBox.getBoundingClientRect());

		const siblingNodeUIs = (Array.from(childHolder.DOM.childNodes) as HTMLElement[]).filter((a) => a.classList.contains('NodeUI'));
		const siblingNodeUIInnerDOMs = siblingNodeUIs.map((nodeUI) => nodeUI.QuerySelector_BreadthFirst('.NodeUI_Inner')).filter((a) => a != null); // entry can be null if inner-ui still loading
		const firstOffsetInner = siblingNodeUIInnerDOMs.find((a) => a && a.style.transform && a.style.transform.includes('translate('));

		let placeholderRect: VRect;
		if (firstOffsetInner) {
			const firstOffsetInnerRect = VRect.FromLTWH(firstOffsetInner.getBoundingClientRect()).NewTop((top) => top - dragBoxRect.height);
			const firstOffsetInnerRect_relative = new VRect(firstOffsetInnerRect.Position.Minus(childHolderRect.Position), firstOffsetInnerRect.Size);

			placeholderRect = firstOffsetInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
		} else {
			if (siblingNodeUIInnerDOMs.length) {
				const lastInner = siblingNodeUIInnerDOMs.Last();
				const lastInnerRect = VRect.FromLTWH(lastInner.getBoundingClientRect()).NewTop((top) => top - dragBoxRect.height);
				const lastInnerRect_relative = new VRect(lastInnerRect.Position.Minus(childHolderRect.Position), lastInnerRect.Size);

				placeholderRect = lastInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
				// if (dragBoxRect.Center.y > firstOffsetInnerRect.Center.y) {
				placeholderRect.y += lastInnerRect.height;
			} else {
				placeholderRect = new VRect(Vector2i.zero, dragBoxRect.Size);
			}
		}

		this.SetState({ placeholderRect });
	}

	get Expanded() {
		const { map, path, type } = this.props;
		const expandKey = type ? `expanded_${HolderType[type].toLowerCase()}` : 'expanded';
		const nodeView = GetNodeView(map._key, path);
		return nodeView[expandKey];
	}

	get ChildOrderStr() {
		const { nodeChildrenToShow, nodeChildren_fillPercents } = this.PropsStash;
		return nodeChildrenToShow.OrderBy((a) => nodeChildren_fillPercents[a._key]).map((a) => a._key).join(',');
	}

	PostRender() {
		this.CheckForLocalChanges();
	}

	lastHeight = 0;
	lastDividePoint = 0;
	lastOrderStr = null;
	// Checks for at-our-level state that may require us to update our width or child-box-offsets (for positioning our lines to child nodes).
	// Note that there are other pathways by which our width/child-box-offsets may be updated. (eg. if child box repositions, an update is triggered through OnChildHeightOrPosChange)
	CheckForLocalChanges() {
		// if (this.lastRender_source == RenderSource.SetState) return;
		const { node, onHeightOrDividePointChange } = this.props;

		const height = this.DOM_HTML.offsetHeight;
		const dividePoint = this.GetDividePoint();
		if (height != this.lastHeight || dividePoint != this.lastDividePoint) {
			MaybeLog((a) => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnHeightChange NodeChildHolder (${RenderSource[this.lastRender_source]}):${this.props.node._key}${nl}dividePoint:${dividePoint}`);

			// this.UpdateState(true);
			this.UpdateChildrenWidthOverride();
			this.UpdateChildBoxOffsets();
			if (onHeightOrDividePointChange) onHeightOrDividePointChange(dividePoint);
		}
		this.lastHeight = height;
		this.lastDividePoint = dividePoint;

		const orderStr = this.ChildOrderStr;
		if (orderStr != this.lastOrderStr) {
			// this.OnChildHeightOrPosOrOrderChange();
			// this.UpdateChildrenWidthOverride();
			this.UpdateChildBoxOffsets();
			// this.ReportDividePointChange();
		}
		this.lastOrderStr = orderStr;
	}

	OnChildHeightOrPosChange_updateStateQueued = false;
	OnChildHeightOrPosChange = () => {
		const { node } = this.props;
		MaybeLog((a) => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
			() => `OnChildHeightOrPosChange NodeUI (${RenderSource[this.lastRender_source]}):${this.props.node._key}\ncenterY:${this.GetDividePoint()}`);

		// this.OnHeightOrPosChange();
		// wait one frame, so that if multiple calls to this method occur in the same frame, we only have to call OnHeightOrPosChange() once
		if (!this.OnChildHeightOrPosChange_updateStateQueued) {
			this.OnChildHeightOrPosChange_updateStateQueued = true;
			requestAnimationFrame(() => {
				this.OnChildHeightOrPosChange_updateStateQueued = false;
				if (!this.mounted) return;
				this.UpdateChildrenWidthOverride();
				this.UpdateChildBoxOffsets();
				this.CheckForLocalChanges();
			});
		}
	};

	GetDividePoint() {
		if (this.argumentsControlBar) {
			// return upChildHolder.css("display") != "none" ? upChildHolder.outerHeight() : 0;
			return this.childHolder && (this.childHolder.DOM as HTMLElement).style.visibility != 'hidden'
				? $(this.argumentsControlBar.DOM).GetScreenRect().Center.y + 1 - $(this.childHolder.DOM).GetScreenRect().y
				: 0;
		}
		// return childHolder.css("display") != "none" ? childHolder.outerHeight() / 2 : 0,
		return this.childHolder && (this.childHolder.DOM as HTMLElement).style.visibility != 'hidden' ? $(this.childHolder.DOM).GetScreenRect().height / 2 : 0;
	}

	UpdateChildrenWidthOverride(forceUpdate = false) {
		if (!this.Expanded) return;

		const childBoxes = this.childBoxes.VValues().filter((a) => a != null);

		const cancelIfStateSame = !forceUpdate;
		const changedState = this.SetState({
			childrenWidthOverride: childBoxes.map((comp) => comp.GetMeasurementInfo().width).concat(0).Max(null, true),
		}, null, cancelIfStateSame, true);
		// Log(`Changed state? (${this.props.node._id}): ` + changedState);
	}
	UpdateChildBoxOffsets(forceUpdate = false) {
		const childBoxes = this.childBoxes.VValues().filter((a) => a != null);
		const newState = {} as any;

		const showAddArgumentButtons = false; // node.type == MapNodeType.Claim && expanded && nodeChildren != emptyArray_forLoading; // && nodeChildren.length > 0;
		// if (this.lastRender_source == RenderSource.SetState && this.refs.childHolder) {
		if (this.Expanded && this.childHolder) {
			const holderRect = VRect.FromLTWH(this.childHolder.DOM.getBoundingClientRect());

			const oldChildBoxOffsets = this.childBoxes.Pairs().filter((pair) => pair.value != null).ToMap((pair) => pair.key, (pair) => {
				// let childBox = FindDOM_(pair.value).find("> div:first-child > div"); // get inner-box of child
				// let childBox = $(GetDOM(pair.value)).find(".NodeUI_Inner").first(); // get inner-box of child
				// not sure why this is needed... (bad sign!)
				if (pair.value.NodeUIForDisplayedNode.innerUI == null) return null;

				const childBox = pair.value.NodeUIForDisplayedNode.innerUI.DOM;
				// Assert(childBox.length, 'Could not find inner-ui of child-box.');
				if (childBox == null) return null; // if can't find child-node's box, don't draw line for it (can happen if dragging child-node)
				if (childBox.matches('.DragPreview')) return null; // don't draw line to node-box being dragged

				let childBoxOffset = VRect.FromLTWH(childBox.getBoundingClientRect()).Position.Minus(holderRect.Position);
				Assert(childBoxOffset.x < 100, 'Something is wrong. X-offset should never be more than 100.');
				childBoxOffset = childBoxOffset.Plus(new Vector2i(0, childBox.getBoundingClientRect().height / 2));
				return childBoxOffset;
			});
			newState.oldChildBoxOffsets = oldChildBoxOffsets;
		}

		const cancelIfStateSame = !forceUpdate;
		const changedState = this.SetState(newState, null, cancelIfStateSame, true);
		// Log(`Changed state? (${this.props.node._id}): ` + changedState);
	}
}

export class ChildLimitBar extends BaseComponentPlus({} as {map: Map, path: string, childrenWidthOverride: number, direction: 'up' | 'down', childCount: number, childLimit: number}, {}) {
	static HEIGHT = 36;
	render() {
		const { map, path, childrenWidthOverride, direction, childCount, childLimit } = this.props;
		const nodeView = GetNodeView(map._key, path);
		const initialChildLimit = store.main.maps.initialChildLimit;
		return (
			<Row style={{
				// position: "absolute", marginTop: -30,
				[direction == 'up' ? 'marginBottom' : 'marginTop']: 10, width: childrenWidthOverride, cursor: 'default',
			}}>
				<Button text={
					<Row>
						<Icon icon={`arrow-${direction}`} size={15}/>
						<Div ml={3}>{childCount > childLimit ? childCount - childLimit : null}</Div>
					</Row>
				} title="Show more"
				enabled={childLimit < childCount} style={ES({ flex: 1 })} onClick={() => {
					runInAction('ChildLimitBar.showMore.onClick', () => {
						nodeView[`childLimit_${direction}`] = (childLimit + 3).KeepAtMost(childCount);
					});
				}}/>
				<Button ml={5} text={
					<Row>
						<Icon icon={`arrow-${direction == 'up' ? 'down' : 'up'}`} size={15}/>
						{/* <Div ml={3}>{childCount > childLimit ? childCount - childLimit : null}</Div> */}
					</Row>
				} title="Show less"
				enabled={childLimit > initialChildLimit} style={ES({ flex: 1 })} onClick={() => {
					runInAction('ChildLimitBar.showLess.onClick', () => {
						nodeView[`childLimit_${direction}`] = (childLimit - 3).KeepAtLeast(initialChildLimit);
					});
				}}/>
			</Row>
		);
	}
}
