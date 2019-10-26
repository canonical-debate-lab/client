import { CachedTransform, Vector2i, emptyObj, nl, Assert, ToJSON, Timer, VRect, WaitXThenRun, Vector3i, Clone } from 'js-vextensions';
import { Button, Column, Div, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, GetInnerComp, RenderSource, GetDOM, UseState, BaseComponent, UseEffect, SimpleShouldUpdate, UseCallback } from 'react-vextensions';
import { GetFillPercent_AtPath } from 'Store/firebase/nodeRatings';
import { GetNodeChildrenL3, HolderType, GetParentNodeL3, GetHolderType, GetParentNodeID } from 'Store/firebase/nodes';
import { MapNodeL3, ClaimForm } from 'Store/firebase/nodes/@MapNode';
import { ArgumentType } from 'Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType, MapNodeType_Info, GetMapNodeTypeDisplayName } from 'Store/firebase/nodes/@MapNodeType';
import { ACTMapNodeChildLimitSet } from 'Store/main/mapViews/$mapView/rootNodeViews';
import { MapNodeView } from 'Store/main/mapViews/@MapViews';
import { NodeConnectorBackground } from 'UI/@Shared/Maps/MapNode/NodeConnectorBackground';
import { NodeUI } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { IsSpecialEmptyArray, State, Connect, MaybeLog, Icon, ErrorBoundary, Watch } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { DroppableInfo } from 'Utils/UI/DNDStructures';
import * as React from 'react';
import { DroppableProvided, Droppable, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { GetPathsToNodesChangedSinceX } from 'Store/firebase/mapNodeEditTimes';
import { useMemo, useCallback } from 'react';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { IsMultiPremiseArgument } from '../../../../../Store/firebase/nodes/$node';
import { Polarity } from '../../../../../Store/firebase/nodes/@MapNode';
import { ArgumentsControlBar } from '../ArgumentsControlBar';
import { NodeChildHolderBox } from './NodeChildHolderBox';

type Props = {
	map: Map, node: MapNodeL3, path: string, nodeView: MapNodeView, nodeChildrenToShow: MapNodeL3[], type: HolderType,
	separateChildren: boolean, showArgumentsControlBar: boolean, linkSpawnPoint: number, vertical?: boolean, minWidth?: number,
	onHeightOrDividePointChange?: (dividePoint: number)=>void,
};

export type NodeChildHolder_InstanceStash = {CheckForChanges};

@SimpleShouldUpdate
export class NodeChildHolder extends BaseComponent<Props, {}, {nodeChildrenToShow, nodeChildren_fillPercents, UpdateChildrenWidthOverride, UpdateChildBoxOffsets, onHeightOrDividePointChange}> {
	static defaultProps = { minWidth: 0 };
	/* static ValidateProps(props) {
		let {node, path} = props;
		//Assert(SplitStringBySlash_Cached(path).Distinct().length == SplitStringBySlash_Cached(path).length, `Node path contains a circular link! (${path})`);
	} */

	childBoxes: {[key: number]: NodeUI} = {};
	instanceStash: NodeChildHolder_InstanceStash;
	render() {
		const { map, node, nodeView, path, nodeChildrenToShow, type, separateChildren, showArgumentsControlBar, linkSpawnPoint, vertical, minWidth, onHeightOrDividePointChange } = this.props;

		// test; attaching stuff to instanceStash is the equivalent of attaching stuff to the component-instance
		// (resolving callback dependency-regression, without requiring usage of "this" -- and letting you use redux/selector data directly, from within those callbacks)
		/* const [instanceStash, _] = UseState({} as {CheckForChanges});
		this.instanceStash = instanceStash; */

		const initialChildLimit = Watch(() => State(a => a.main.initialChildLimit), []);

		/* let nodeChildren_sortValues = IsSpecialEmptyArray(nodeChildrenToShow) ? emptyObj : nodeChildrenToShow.filter(a=>a).ToMap(child=>child._id+"", child=> {
			return GetRatingAverage_AtPath(child, GetSortByRatingType(child));
		});
		let nodeChildren_sortValues = CachedTransform("nodeChildren_sortValues_transform1", [node._id], nodeChildren_sortValues, ()=>nodeChildren_sortValues); */
		const nodeChildren_fillPercents = Watch(() => {
			const early = IsSpecialEmptyArray(nodeChildrenToShow) ? emptyObj : nodeChildrenToShow.filter(a => a).ToMap(child => `${child._key}`, (child) => {
				return GetFillPercent_AtPath(child, `${path}/${child._key}`);
			});
			return CachedTransform('nodeChildren_fillPercents_transform1', [node._key], early, () => early);
		}, [node._key, nodeChildrenToShow, path]);
		const currentNodeBeingAdded_path = Watch(() => State(a => a.main.currentNodeBeingAdded_path), []);

		// rest (not Connect part)
		// ==========

		let [childrenWidthOverride, setChildrenWidthOverride] = UseState(null as number);
		const [oldChildBoxOffsets, setOldChildBoxOffsets] = UseState(null as {[key: number]: Vector2i});
		const [placeholderRect, setPlaceholderRect] = UseState(null as VRect);

		const expandKey = type ? `expanded_${HolderType[type].toLowerCase()}` : 'expanded';
		const expanded = nodeView[expandKey];

		childrenWidthOverride = (childrenWidthOverride | 0).KeepAtLeast(minWidth);

		let nodeChildrenToShowHere = nodeChildrenToShow;
		let nodeChildrenToShowInRelevanceBox;
		if (IsMultiPremiseArgument(node) && type != HolderType.Relevance) {
			nodeChildrenToShowHere = nodeChildrenToShow.filter(a => a && a.type != MapNodeType.Argument);
			nodeChildrenToShowInRelevanceBox = nodeChildrenToShow.filter(a => a && a.type == MapNodeType.Argument);
		}

		let upChildren = separateChildren ? nodeChildrenToShowHere.filter(a => a.finalPolarity == Polarity.Supporting) : [];
		let downChildren = separateChildren ? nodeChildrenToShowHere.filter(a => a.finalPolarity == Polarity.Opposing) : [];

		// apply sorting
		if (separateChildren) {
			upChildren = upChildren.OrderBy(child => nodeChildren_fillPercents[child._key]);
			downChildren = downChildren.OrderByDescending(child => nodeChildren_fillPercents[child._key]);
		} else {
			nodeChildrenToShowHere = nodeChildrenToShowHere.OrderByDescending(child => nodeChildren_fillPercents[child._key]);
			// if (IsArgumentNode(node)) {
			const isArgument_any = node.type == MapNodeType.Argument && node.current.argumentType == ArgumentType.Any;
			if (node.childrenOrder && !isArgument_any) {
				nodeChildrenToShowHere = nodeChildrenToShowHere.OrderBy(child => node.childrenOrder.indexOf(child._key).IfN1Then(Number.MAX_SAFE_INTEGER));
			}
		}

		let childLimit_up = ((nodeView || {}).childLimit_up || initialChildLimit).KeepAtLeast(initialChildLimit);
		let childLimit_down = ((nodeView || {}).childLimit_down || initialChildLimit).KeepAtLeast(initialChildLimit);
		// if the map's root node, or an argument node, show all children
		const showAll = node._key == map.rootNode || node.type == MapNodeType.Argument;
		if (showAll) [childLimit_up, childLimit_down] = [100, 100];

		const StartGeneratingPositionedPlaceholder = (group: 'all' | 'up' | 'down') => {
			const groups = { all: this.allChildHolder, up: this.upChildHolder, down: this.downChildHolder };
			const childHolder = groups[group];
			if (childHolder == null || !childHolder.mounted) {
				// call again in a second, once child-holder is initialized
				WaitXThenRun(0, () => StartGeneratingPositionedPlaceholder(group));
				return;
			}

			const childHolderRect = VRect.FromLTWH(childHolder.DOM.getBoundingClientRect());
			/* const match = firstOffsetInner.style.transform.match(/([0-9]+).+?([0-9]+)/);
			const dragBoxSize = new Vector2i(match[1].ToInt(), match[2].ToInt());
			// delete dragInfo.provided.draggableProps.style.transform; */
			const dragBox = document.querySelector('.NodeUI_Inner.DragPreview');
			if (dragBox == null) return; // this can happen at end of drag
			const dragBoxRect = VRect.FromLTWH(dragBox.getBoundingClientRect());

			const siblingNodeUIs = (childHolder.DOM.childNodes.ToArray() as HTMLElement[]).filter(a => a.classList.contains('NodeUI'));
			const siblingNodeUIInnerDOMs = siblingNodeUIs.map(nodeUI => nodeUI.QuerySelector_BreadthFirst('.NodeUI_Inner')).filter(a => a != null); // entry can be null if inner-ui still loading
			const firstOffsetInner = siblingNodeUIInnerDOMs.find(a => a && a.style.transform && a.style.transform.includes('translate('));

			let placeholderRect: VRect;
			if (firstOffsetInner) {
				const firstOffsetInnerRect = VRect.FromLTWH(firstOffsetInner.getBoundingClientRect()).NewTop(top => top - dragBoxRect.height);
				const firstOffsetInnerRect_relative = new VRect(firstOffsetInnerRect.Position.Minus(childHolderRect.Position), firstOffsetInnerRect.Size);

				placeholderRect = firstOffsetInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
			} else {
				if (siblingNodeUIInnerDOMs.length) {
					const lastInner = siblingNodeUIInnerDOMs.Last();
					const lastInnerRect = VRect.FromLTWH(lastInner.getBoundingClientRect()).NewTop(top => top - dragBoxRect.height);
					const lastInnerRect_relative = new VRect(lastInnerRect.Position.Minus(childHolderRect.Position), lastInnerRect.Size);

					placeholderRect = lastInnerRect_relative.NewWidth(dragBoxRect.width).NewHeight(dragBoxRect.height);
					// if (dragBoxRect.Center.y > firstOffsetInnerRect.Center.y) {
					placeholderRect.y += lastInnerRect.height;
				} else {
					placeholderRect = new VRect(Vector2i.zero, dragBoxRect.Size);
				}
			}

			setPlaceholderRect(placeholderRect);
		};

		// todo: make sure we have all the dependencies included
		const OnChildHeightOrPosChange = useCallback(() => {
			MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnChildHeightOrPosChange NodeUI (${RenderSource[this.lastRender_source]}):${node._key}\ncenterY:${this.GetDividePoint()}`);

			// this.OnHeightOrPosChange();
			// wait one frame, so that if multiple calls to this method occur in the same frame, we only have to call OnHeightOrPosChange() once
			if (!this.OnChildHeightOrPosChange_updateStateQueued) {
				this.OnChildHeightOrPosChange_updateStateQueued = true;
				requestAnimationFrame(() => {
					this.OnChildHeightOrPosChange_updateStateQueued = false;
					if (!this.mounted) return;
					/* this.UpdateChildrenWidthOverride();
					this.UpdateChildBoxOffsets(); */
					this.CheckForChanges();
				});
			}
		// }, []); // not sure if we need to add instanceStash as a dependency; I think not, since useMemo for func has same lifetime as useState for instanceStash (I think)
		// }, [instanceStash, node._key]);
		}, [node._key]);

		const RenderChild = (child: MapNodeL3, index: number, collection, direction = 'down' as 'up' | 'down') => {
			/* if (pack.node.premiseAddHelper) {
				return <PremiseAddHelper mapID={map._id} parentNode={node} parentPath={path}/>;
			} */

			const childLimit = direction == 'down' ? childLimit_down : childLimit_up;
			return (
				// <ErrorBoundary errorUI={props=>props.defaultUI(E(props, {style: {width: 500, height: 300}}))}>
				<ErrorBoundary key={child._key} errorUIStyle={{ width: 500, height: 300 }}>
					<NodeUI key={child._key} ref={c => this.childBoxes[child._key] = c} indexInNodeList={index} map={map} node={child}
						path={`${path}/${child._key}`} widthOverride={childrenWidthOverride} onHeightOrPosChange={OnChildHeightOrPosChange}>
						{index == (direction == 'down' ? childLimit - 1 : 0) && !showAll && (collection.length > childLimit || childLimit != initialChildLimit) &&
							<ChildLimitBar {...{ map, path, childrenWidthOverride, childLimit }} direction={direction} childCount={collection.length}/>}
					</NodeUI>
				</ErrorBoundary>
			);
		};

		const RenderGroup = (group: 'all' | 'up' | 'down') => {
			const refName = `${group}ChildHolder`;
			const childLimit = group == 'up' ? childLimit_up : childLimit_down; // "all" and "down" share a child-limit
			const childrenHere = group == 'all' ? nodeChildrenToShowHere : group == 'up' ? upChildren : downChildren;

			const dragBox = document.querySelector('.NodeUI_Inner.DragPreview');
			const dragBoxRect = dragBox && VRect.FromLTWH(dragBox.getBoundingClientRect());

			return (
				<Droppable type="MapNode" droppableId={ToJSON(droppableInfo.VSet({ subtype: group, childIDs: childrenHere.map(a => a._key) }))} /* renderClone={(provided, snapshot, descriptor) => {
					const index = descriptor.index;
					const pack = childrenHere.slice(0, childLimit)[index];
					return RenderChild(pack, index, childrenHere);
				}} */>
					{(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
						const dragIsOverDropArea = provided.placeholder.props['on'] != null;
						if (dragIsOverDropArea) {
							WaitXThenRun(0, () => StartGeneratingPositionedPlaceholder(group));
						}

						return (
							<Column ref={(c) => { this[`${group}ChildHolder`] = c; provided.innerRef(GetDOM(c) as any); }} ct className={refName} {...provided.droppableProps}
								style={E(
									{ position: 'relative' },
									childrenHere.length == 0 && { position: 'absolute', top: group == 'down' ? '100%' : 0, width: MapNodeType_Info.for[MapNodeType.Claim].minWidth, height: 100 },
								)}>
								{/* childrenHere.length == 0 && <div style={{ position: 'absolute', top: '100%', width: '100%', height: 200 }}/> */}
								{childrenHere.slice(0, childLimit).map((pack, index) => {
									return RenderChild(pack, index, childrenHere);
								})}
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

		const UpdateChildrenWidthOverride = (forceUpdate = false) => {
			if (!expanded) return;

			const childBoxes = this.childBoxes.VValues().filter(a => a != null);

			const newChildrenWidthOverride = childBoxes.map(comp => comp.GetMeasurementInfo().width).concat(0).Max(null, true);
			if (forceUpdate || ToJSON(newChildrenWidthOverride) != ToJSON(childrenWidthOverride)) {
				const changedState = setChildrenWidthOverride(newChildrenWidthOverride);
				// Log(`Changed state? (${this.props.node._id}): ` + changedState);
			}
		};

		const UpdateChildBoxOffsets = (forceUpdate = false) => {
			const childHolder = $(this);
			const upChildHolder = childHolder.children('.upChildHolder');
			const downChildHolder = childHolder.children('.downChildHolder');
			const argumentsControlBar = childHolder.children('.argumentsControlBar');

			const childBoxes = this.childBoxes.VValues().filter(a => a != null);

			let newChildBoxOffsets = Clone(oldChildBoxOffsets); // make different, so that if forceUpdate is true, equality-check fails and we cause ui refresh (not sure if needed, but done to preserve logic when updating to react-hooks)

			const showAddArgumentButtons = false; // node.type == MapNodeType.Claim && expanded && nodeChildren != emptyArray_forLoading; // && nodeChildren.length > 0;
			// if (this.lastRender_source == RenderSource.SetState && this.refs.childHolder) {
			if (expanded && this.childHolder) {
				const holderRect = VRect.FromLTWH(this.childHolder.DOM.getBoundingClientRect());

				const oldChildBoxOffsets = this.childBoxes.Props().filter(pair => pair.value != null).ToMap(pair => pair.name, (pair) => {
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
				newChildBoxOffsets = oldChildBoxOffsets;
			}

			if (forceUpdate || ToJSON(newChildBoxOffsets) != ToJSON(oldChildBoxOffsets)) {
				const changedState = setOldChildBoxOffsets(newChildBoxOffsets);
				// Log(`Changed state? (${this.props.node._id}): ` + changedState);
			}
		};

		// instanceStash.CheckForChanges = CheckForChanges;

		this.Stash({ UpdateChildBoxOffsets, UpdateChildrenWidthOverride, nodeChildrenToShow, nodeChildren_fillPercents, onHeightOrDividePointChange });

		const droppableInfo = new DroppableInfo({ type: 'NodeChildHolder', parentPath: path });
		this.childBoxes = {};
		return (
			<Column ref={c => this.childHolder = c} className="childHolder clickThrough" style={E(
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
					<NodeChildHolderBox {...{ map, node, path, nodeView }} type={HolderType.Relevance} widthOverride={childrenWidthOverride}
						widthOfNode={childrenWidthOverride}
						nodeChildren={GetNodeChildrenL3(node, path)} nodeChildrenToShow={nodeChildrenToShowInRelevanceBox}
						onHeightOrDividePointChange={UseCallback(dividePoint => this.CheckForChanges(), [])}/>}
				{!separateChildren &&
					RenderGroup('all')}
				{separateChildren &&
					RenderGroup('up')}
				{showArgumentsControlBar &&
					<ArgumentsControlBar ref={c => this.argumentsControlBar = c} map={map} node={node} path={path} childBeingAdded={currentNodeBeingAdded_path == `${path}/?`}/>}
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

	lastHeight = 0;
	lastDividePoint = 0;
	lastOrderStr = null;

	OnChildHeightOrPosChange_updateStateQueued = false;

	CheckForChanges = () => {
		const { node, nodeChildrenToShow, nodeChildren_fillPercents, UpdateChildrenWidthOverride, UpdateChildBoxOffsets, onHeightOrDividePointChange } = this.PropsStateStash;

		const ChildOrderStr = () => {
			return nodeChildrenToShow.OrderBy(a => nodeChildren_fillPercents[a._key]).map(a => a._key).join(',');
		};

		// if (this.lastRender_source == RenderSource.SetState) return;

		const height = $(GetDOM(this)).outerHeight();
		const dividePoint = this.GetDividePoint();
		if (height != this.lastHeight || dividePoint != this.lastDividePoint) {
			MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnHeightChange NodeChildHolder (${RenderSource[this.lastRender_source]}):${node._key}${nl
				}dividePoint:${dividePoint}`);

			// this.UpdateState(true);
			UpdateChildrenWidthOverride();
			UpdateChildBoxOffsets();
			if (onHeightOrDividePointChange) onHeightOrDividePointChange(dividePoint);
		}
		this.lastHeight = height;
		this.lastDividePoint = dividePoint;

		const orderStr = ChildOrderStr();
		if (orderStr != this.lastOrderStr) {
			// this.OnChildHeightOrPosOrOrderChange();
			// this.UpdateChildrenWidthOverride();
			UpdateChildBoxOffsets();
			// this.ReportDividePointChange();
		}
		this.lastOrderStr = orderStr;
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
}

const ChildLimitBar_connector = (state, props: {map: Map, path: string, childrenWidthOverride: number, direction: 'up' | 'down', childCount: number, childLimit: number}) => ({
	initialChildLimit: State(a => a.main.initialChildLimit),
});
@Connect(ChildLimitBar_connector)
export class ChildLimitBar extends BaseComponentWithConnector(ChildLimitBar_connector, {}) {
	static HEIGHT = 36;
	render() {
		const { map, path, childrenWidthOverride, direction, childCount, childLimit, initialChildLimit } = this.props;
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
					store.dispatch(new ACTMapNodeChildLimitSet({ mapID: map._key, path, direction, value: (childLimit + 3).KeepAtMost(childCount) }));
				}}/>
				<Button ml={5} text={
					<Row>
						<Icon icon={`arrow-${direction == 'up' ? 'down' : 'up'}`} size={15}/>
						{/* <Div ml={3}>{childCount > childLimit ? childCount - childLimit : null}</Div> */}
					</Row>
				} title="Show less"
				enabled={childLimit > initialChildLimit} style={ES({ flex: 1 })} onClick={() => {
					store.dispatch(new ACTMapNodeChildLimitSet({ mapID: map._key, path, direction, value: (childLimit - 3).KeepAtLeast(initialChildLimit) }));
				}}/>
			</Row>
		);
	}
}
