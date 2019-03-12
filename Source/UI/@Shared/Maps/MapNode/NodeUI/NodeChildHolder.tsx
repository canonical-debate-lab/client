import { CachedTransform, Vector2i, emptyObj, nl, Assert, ToJSON } from 'js-vextensions';
import { Button, Column, Div, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, GetInnerComp, RenderSource, GetDOM } from 'react-vextensions';
import { GetFillPercent_AtPath } from 'Store/firebase/nodeRatings';
import { GetNodeChildrenL3, HolderType } from 'Store/firebase/nodes';
import { MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { ArgumentType } from 'Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { ACTMapNodeChildLimitSet } from 'Store/main/mapViews/$mapView/rootNodeViews';
import { MapNodeView } from 'Store/main/mapViews/@MapViews';
import { NodeConnectorBackground } from 'UI/@Shared/Maps/MapNode/NodeConnectorBackground';
import { NodeUI } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { IsSpecialEmptyArray, State, Connect, MaybeLog, Icon } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { DroppableInfo } from 'Utils/UI/DNDStructures';
import { Droppable } from 'react-beautiful-dnd';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { IsMultiPremiseArgument } from '../../../../../Store/firebase/nodes/$node';
import { Polarity } from '../../../../../Store/firebase/nodes/@MapNode';
import { ArgumentsControlBar } from '../ArgumentsControlBar';
import { NodeChildHolderBox } from './NodeChildHolderBox';


/* export class ChildPackUI extends BaseComponent
		<{
			map: Map, path: string, childrenWidthOverride: number, showAll: boolean, childLimit_up: number, childLimit_down: number,
			pack: ChildPack, index: number, collection: ChildPack[], direction?: "up" | "down",
		}, {}> {
	static defaultProps = {direction: "down"};
	render() {
		let {map, path, childrenWidthOverride, childLimit_up, childLimit_down, showAll, pack, index, direction} = this.props;
		/*if (pack.node.premiseAddHelper) {
			return <PremiseAddHelper mapID={map._id} parentNode={node} parentPath={path}/>;
		}*#/

		let childLimit = direction == "down" ? childLimit_down : childLimit_up;
		return (
			<NodeUI key={pack.node._id} map={map} node={pack.node}
					path={path + "/" + pack.node._id} widthOverride={childrenWidthOverride} onHeightOrPosChange={this.OnChildHeightOrPosChange}>
				{index == (direction == "down" ? childLimit - 1 : 0) && !showAll && (collection.length > childLimit || childLimit != initialChildLimit) &&
					<ChildLimitBar {...{map, path, childrenWidthOverride, childLimit}} direction={direction} childCount={collection.length}/>}
			</NodeUI>
		);
	}
} */

type Props = {
	map: Map, node: MapNodeL3, path: string, nodeView: MapNodeView, nodeChildrenToShow: MapNodeL3[], type: HolderType,
	separateChildren: boolean, showArgumentsControlBar: boolean, linkSpawnPoint: number, vertical?: boolean, minWidth?: number,
	onHeightOrDividePointChange?: (dividePoint: number)=>void,
};
const initialState = {
	childrenWidthOverride: null as number,
	oldChildBoxOffsets: null as {[key: number]: Vector2i},
};

const connector = (state, { node, path, nodeChildrenToShow }: Props) => {
	/* let nodeChildren_sortValues = IsSpecialEmptyArray(nodeChildrenToShow) ? emptyObj : nodeChildrenToShow.filter(a=>a).ToMap(child=>child._id+"", child=> {
		return GetRatingAverage_AtPath(child, GetSortByRatingType(child));
	}); */
	const nodeChildren_fillPercents = IsSpecialEmptyArray(nodeChildrenToShow) ? emptyObj : nodeChildrenToShow.filter(a => a).ToMap(child => `${child._key}`, (child) => {
		return GetFillPercent_AtPath(child, `${path}/${child._key}`);
	});

	return {
		initialChildLimit: State(a => a.main.initialChildLimit),
		// nodeChildren_sortValues: CachedTransform("nodeChildren_sortValues_transform1", [node._id], nodeChildren_sortValues, ()=>nodeChildren_sortValues),
		nodeChildren_fillPercents: CachedTransform('nodeChildren_fillPercents_transform1', [node._key], nodeChildren_fillPercents, () => nodeChildren_fillPercents),
		currentNodeBeingAdded_path: State(a => a.main.currentNodeBeingAdded_path),
	};
};
@Connect(connector)
export class NodeChildHolder extends BaseComponentWithConnector(connector, initialState) {
	static defaultProps = { minWidth: 0 };
	/* static ValidateProps(props) {
		let {node, path} = props;
		//Assert(SplitStringBySlash_Cached(path).Distinct().length == SplitStringBySlash_Cached(path).length, `Node path contains a circular link! (${path})`);
	} */

	childBoxes: {[key: number]: NodeUI} = {};
	render() {
		const { map, node, nodeView, path, nodeChildrenToShow, type, separateChildren, showArgumentsControlBar, linkSpawnPoint, vertical, minWidth, onHeightOrDividePointChange,
			initialChildLimit, nodeChildren_fillPercents, currentNodeBeingAdded_path } = this.props;
		let { childrenWidthOverride, oldChildBoxOffsets } = this.state;
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

		const RenderChild = (child: MapNodeL3, index: number, collection, direction = 'down' as 'up' | 'down') => {
			/* if (pack.node.premiseAddHelper) {
				return <PremiseAddHelper mapID={map._id} parentNode={node} parentPath={path}/>;
			} */

			const childLimit = direction == 'down' ? childLimit_down : childLimit_up;
			return (
				<NodeUI key={child._key} ref={c => this.childBoxes[child._key] = c} indexInNodeList={index} map={map} node={child}
					path={`${path}/${child._key}`} widthOverride={childrenWidthOverride} onHeightOrPosChange={this.OnChildHeightOrPosChange}>
					{index == (direction == 'down' ? childLimit - 1 : 0) && !showAll && (collection.length > childLimit || childLimit != initialChildLimit) &&
						<ChildLimitBar {...{ map, path, childrenWidthOverride, childLimit }} direction={direction} childCount={collection.length}/>}
				</NodeUI>
			);
		};

		const droppableInfo = new DroppableInfo({ type: 'NodeChildHolder', parentPath: path });
		this.childBoxes = {};
		return (
			<Column ref={c => this.childHolder = c} className="childHolder clickThrough" style={E(
				{
					marginLeft: vertical ? 20 : (nodeChildrenToShow.length || showArgumentsControlBar) ? 30 : 0,
					// display: "flex", flexDirection: "column", marginLeft: 10, maxHeight: expanded ? 500 : 0, transition: "max-height 1s", overflow: "hidden",
				},
				//! expanded && {visibility: "hidden", height: 0}, // maybe temp; fix for lines-sticking-to-top issue
				// if we don't know our child offsets yet, render still (so we can measure ourself), but make self invisible
				oldChildBoxOffsets == null && { opacity: 0, pointerEvents: 'none' },
			)}>
				{linkSpawnPoint && oldChildBoxOffsets &&
					// <NodeConnectorBackground node={node} linkSpawnPoint={vertical ? Vector2iCache.Get(0, linkSpawnPoint) : Vector2iCache.Get(-30, linkSpawnPoint)}
					<NodeConnectorBackground node={node} linkSpawnPoint={vertical ? new Vector2i(-10, 0) : new Vector2i(-30, linkSpawnPoint)} straightLines={vertical}
						shouldUpdate={true} // this.lastRender_source == RenderSource.SetState}
						nodeChildren={nodeChildrenToShowHere} childBoxOffsets={oldChildBoxOffsets}/>}

				{/* if we're for multi-premise arg, and this comp is not already showing relevance-args, show them in a "Taken together, are these claims relevant?" box */}
				{IsMultiPremiseArgument(node) && type != HolderType.Relevance &&
					<NodeChildHolderBox {...{ map, node, path, nodeView }} type={HolderType.Relevance} widthOverride={childrenWidthOverride}
						widthOfNode={childrenWidthOverride}
						nodeChildren={GetNodeChildrenL3(node, path)} nodeChildrenToShow={nodeChildrenToShowInRelevanceBox}
						onHeightOrDividePointChange={dividePoint => this.CheckForChanges()}/>}
				{!separateChildren &&
					<Droppable type="MapNode" droppableId={ToJSON(droppableInfo)}>{(provided, snapshot) => (
						<Column ref={c => provided.innerRef(GetDOM(c))}>
							{nodeChildrenToShowHere.slice(0, childLimit_down).map((pack, index) => {
								return RenderChild(pack, index, nodeChildrenToShowHere);
							})}
							{provided.placeholder}
						</Column>
					)}</Droppable>}
				{separateChildren &&
					<Droppable type="MapNode" droppableId={ToJSON(droppableInfo.VSet({ subtype: 'up' }))}>{(provided, snapshot) => (
						<Column ref={(c) => { this.upChildHolder = c; provided.innerRef(GetDOM(c)); }} ct className="upChildHolder">
							{upChildren.slice(-childLimit_up).map((child, index) => {
								return RenderChild(child, index, upChildren, 'up');
							})}
							{provided.placeholder}
						</Column>
					)}</Droppable>}
				{showArgumentsControlBar &&
					<ArgumentsControlBar ref={c => this.argumentsControlBar = c} map={map} node={node} path={path} childBeingAdded={currentNodeBeingAdded_path == `${path}/?`}/>}
				{separateChildren &&
					<Droppable type="MapNode" droppableId={ToJSON(droppableInfo.VSet({ subtype: 'down' }))}>{(provided, snapshot) => (
						<Column ref={(c) => { this.downChildHolder = c; provided.innerRef(GetDOM(c)); }} ct className="downChildHolder">
							{downChildren.slice(0, childLimit_down).map((child, index) => {
								return RenderChild(child, index, downChildren, 'down');
							})}
							{provided.placeholder}
						</Column>
					)}</Droppable>}
			</Column>
		);
	}
	childHolder: Column;
	upChildHolder: Column;
	downChildHolder: Column;
	argumentsControlBar: ArgumentsControlBar;

	get Expanded() {
		const { type, nodeView } = this.props;
		const expandKey = type ? `expanded_${HolderType[type].toLowerCase()}` : 'expanded';
		return nodeView[expandKey];
	}

	get ChildOrderStr() {
		const { nodeChildrenToShow, nodeChildren_fillPercents } = this.props;
		return nodeChildrenToShow.OrderBy(a => nodeChildren_fillPercents[a._key]).map(a => a._key).join(',');
	}

	PostRender() {
		this.CheckForChanges();
	}

	lastHeight = 0;
	lastDividePoint = 0;
	lastOrderStr = null;
	CheckForChanges() {
		// if (this.lastRender_source == RenderSource.SetState) return;
		const { node, onHeightOrDividePointChange } = this.props;

		const height = $(GetDOM(this)).outerHeight();
		const dividePoint = this.GetDividePoint();
		if (height != this.lastHeight || dividePoint != this.lastDividePoint) {
			MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
				() => `OnHeightChange NodeChildHolder (${RenderSource[this.lastRender_source]}):${this.props.node._key}${nl
				}dividePoint:${dividePoint}`);

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
	OnChildHeightOrPosChange() {
		const { node } = this.props;
		MaybeLog(a => a.nodeRenderDetails && (a.nodeRenderDetails_for == null || a.nodeRenderDetails_for == node._key),
			() => `OnChildHeightOrPosChange NodeUI (${RenderSource[this.lastRender_source]}):${this.props.node._key}\ncenterY:${this.GetDividePoint()}`);

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
	}

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
		const { map, node, path, children, nodeView, linkSpawnPoint } = this.props;
		if (!this.Expanded) return;

		const childBoxes = this.childBoxes.VValues().filter(a => a != null);

		const cancelIfStateSame = !forceUpdate;
		const changedState = this.SetState({
			childrenWidthOverride: childBoxes.map(comp => comp.GetMeasurementInfo().width).concat(0).Max(null, true),
		}, null, cancelIfStateSame, true);
		// Log(`Changed state? (${this.props.node._id}): ` + changedState);
	}
	UpdateChildBoxOffsets(forceUpdate = false) {
		const { map, node, path, children, nodeView, linkSpawnPoint } = this.props;
		const childHolder = $(this);
		const upChildHolder = childHolder.children('.upChildHolder');
		const downChildHolder = childHolder.children('.downChildHolder');
		const argumentsControlBar = childHolder.children('.argumentsControlBar');

		const childBoxes = this.childBoxes.VValues().filter(a => a != null);
		const newState = {} as any;

		const showAddArgumentButtons = false; // node.type == MapNodeType.Claim && expanded && nodeChildren != emptyArray_forLoading; // && nodeChildren.length > 0;
		// if (this.lastRender_source == RenderSource.SetState && this.refs.childHolder) {
		if (this.Expanded && this.childHolder) {
			const holderOffset = new Vector2i($(GetDOM(this.childHolder)).offset());

			const oldChildBoxOffsets = this.childBoxes.Props().filter(pair => pair.value != null).ToMap(pair => pair.name, (pair) => {
				// let childBox = FindDOM_(pair.value).find("> div:first-child > div"); // get inner-box of child
				// let childBox = $(GetDOM(pair.value)).find(".NodeUI_Inner").first(); // get inner-box of child
				// not sure why this is needed... (bad sign!)
				if (pair.value.NodeUIForDisplayedNode.innerUI == null) return new Vector2i(0, 0);

				const childBox = $(pair.value.NodeUIForDisplayedNode.innerUI.DOM);
				Assert(childBox.length, 'Could not find inner-ui of child-box.');
				let childBoxOffset = new Vector2i(childBox.offset()).Minus(holderOffset);
				Assert(childBoxOffset.x < 100, 'Something is wrong. X-offset should never be more than 100.');
				childBoxOffset = childBoxOffset.Plus(new Vector2i(0, childBox.outerHeight() / 2));
				return childBoxOffset;
			});
			newState.oldChildBoxOffsets = oldChildBoxOffsets;
		}

		const cancelIfStateSame = !forceUpdate;
		const changedState = this.SetState(newState, null, cancelIfStateSame, true);
		// Log(`Changed state? (${this.props.node._id}): ` + changedState);
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
