import chroma from 'chroma-js';
import classNames from 'classnames';
import { DoNothing, Timer, ToJSON, Vector2i, VRect, WaitXThenRun, IsNumber, Assert, A } from 'js-vextensions';
import { Draggable } from 'react-beautiful-dnd';
import ReactDOM from 'react-dom';
import { BaseComponent, BaseComponentWithConnector, GetDOM, Handle, UseEffect, UseState, SimpleShouldUpdate, UseCallback, WarnOfTransientObjectProps } from 'react-vextensions';
import { ReasonScoreValues_RSPrefix, RS_CalculateTruthScore, RS_CalculateTruthScoreComposite, RS_GetAllValues } from 'Store/firebase/nodeRatings/ReasonScore';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { GetTimeFromWhichToShowChangedNodes } from 'Store/main/maps/$map';
import { GetPathNodeIDs } from 'Store/main/mapViews';
import { GADDemo } from 'UI/@GAD/GAD';
import { Connect, DragInfo, ErrorBoundary, HSLA, IsDoubleClick, SlicePath, State, UseSelector, ExpensiveComponent } from 'Utils/FrameworkOverrides';
import { DraggableInfo } from 'Utils/UI/DNDStructures';
import { useCallback, useEffect } from 'react';
import { ChangeType, GetChangeTypeOutlineColor } from '../../../../Store/firebase/mapNodeEditTimes';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { GetFillPercent_AtPath, GetMarkerPercent_AtPath, GetNodeRatingsRoot, GetRatingAverage_AtPath, GetRatings, RatingFilter } from '../../../../Store/firebase/nodeRatings';
import { RatingType, ratingTypes } from '../../../../Store/firebase/nodeRatings/@RatingType';
import { GetParentNodeL3, IsNodeSubnode } from '../../../../Store/firebase/nodes';
import { GetMainRatingType, GetNodeForm, GetNodeL3, GetPaddingForNode, IsPremiseOfSinglePremiseArgument } from '../../../../Store/firebase/nodes/$node';
import { ClaimForm, MapNodeL3 } from '../../../../Store/firebase/nodes/@MapNode';
import { GetNodeColor, MapNodeType, MapNodeType_Info } from '../../../../Store/firebase/nodes/@MapNodeType';
import { MeID } from '../../../../Store/firebase/users';
import { GetLastAcknowledgementTime, WeightingType } from '../../../../Store/main';
import { ACTMapNodeExpandedSet, ACTMapNodePanelOpen, ACTMapNodeSelect, ACTMapNodeTermOpen } from '../../../../Store/main/mapViews/$mapView/rootNodeViews';
import { MapNodeView } from '../../../../Store/main/mapViews/@MapViews';
import { ExpandableBox } from './ExpandableBox';
import { DefinitionsPanel } from './NodeUI/Panels/DefinitionsPanel';
import { DetailsPanel } from './NodeUI/Panels/DetailsPanel';
import { DiscussionPanel } from './NodeUI/Panels/DiscussionPanel';
import { HistoryPanel } from './NodeUI/Panels/HistoryPanel';
import { OthersPanel } from './NodeUI/Panels/OthersPanel';
import { PhrasingsPanel } from './NodeUI/Panels/PhrasingsPanel';
import { RatingsPanel } from './NodeUI/Panels/RatingsPanel';
import { SocialPanel } from './NodeUI/Panels/SocialPanel';
import { TagsPanel } from './NodeUI/Panels/TagsPanel';
import { SubPanel } from './NodeUI_Inner/SubPanel';
import { TitlePanel } from './NodeUI_Inner/TitlePanel';
import { MapNodeUI_LeftBox } from './NodeUI_LeftBox';
import { NodeUI_Menu_Stub } from './NodeUI_Menu';

// drag and drop
// ==========

/* const dragSourceDecorator = DragSource('node',
	{
		canDrag: ({ map, node, path }) => ForCopy_GetError(MeID(), node) == null,
		beginDrag: ({ map, node, path }) => ({ map, node, path }),
	},
	(connect, monitor) => ({
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	})); */

// main
// ==========

// export type NodeHoverExtras = {panel?: string, term?: number};

type Props = {
	indexInNodeList: number, map: Map, node: MapNodeL3, nodeView: MapNodeView, path: string, width: number, widthOverride?: number,
	panelPosition?: 'left' | 'below', useLocalPanelState?: boolean, style?,
} & {dragInfo?: DragInfo};

/* @MakeDraggable(({ node, path, indexInNodeList }: TitlePanelProps) => {
	if (!IsUserCreatorOrMod(MeID(), node)) return null;
	if (!path.includes('/')) return null; // don't make draggable if root-node of map
	return {
		type: 'MapNode',
		draggableInfo: new DraggableInfo({ nodePath: path }),
		index: indexInNodeList,
	};
}) */
@ExpensiveComponent
export class NodeUI_Inner extends BaseComponent<Props, {}, {setHovered}> {
	static defaultProps = { panelPosition: 'left' };
	// static warnOfTransientObjectProps = true;

	root: ExpandableBox;
	// titlePanel: TitlePanel;
	titlePanel: Handle<typeof TitlePanel>;

	checkStillHoveredTimer = new Timer(100, () => {
		const { setHovered } = this.stash;

		const dom = GetDOM(this.root);
		if (dom == null) {
			this.checkStillHoveredTimer.Stop();
			return;
		}
		const mainRect = VRect.FromLTWH(dom.getBoundingClientRect());

		const leftBoxDOM = dom.querySelector('.NodeUI_LeftBox');
		const leftBoxRect = leftBoxDOM ? VRect.FromLTWH(leftBoxDOM.getBoundingClientRect()) : null;

		const mouseRect = new VRect(mousePos, new Vector2i(1, 1));
		const intersectsOne = mouseRect.Intersects(mainRect) || (leftBoxRect && mouseRect.Intersects(leftBoxRect));
		// Log(`Main: ${mainRect} Mouse:${mousePos} Intersects one?:${intersectsOne}`);
		setHovered(intersectsOne);
	});

	render() {
		const { indexInNodeList, map, node, nodeView, path, width, widthOverride, panelPosition, useLocalPanelState, style } = this.props;

		// connector part
		// ==========

		let sinceTime = GetTimeFromWhichToShowChangedNodes.Watch(map._key);
		/* let pathsToChangedNodes = GetPathsToNodesChangedSinceX(map._id, sinceTime);
		let ownNodeChanged = pathsToChangedNodes.Any(a=>a.split("/").Any(b=>b == node._id));
		let changeType = ownNodeChanged ? GetNodeChangeType(node, sinceTime) : null; */

		const lastAcknowledgementTime = GetLastAcknowledgementTime.Watch(node._key);
		sinceTime = sinceTime.KeepAtLeast(lastAcknowledgementTime);

		let changeType: ChangeType;
		if (node.createdAt > sinceTime) changeType = ChangeType.Add;
		else if (node.current.createdAt > sinceTime) changeType = ChangeType.Edit;

		// const parent = UseSelector(() => GetNodeL3(SlicePath(path, 1)));
		// const parent = GetNodeL3(SlicePath(path, 1)); // removed UseSelector on this for now, since it somehow causes refresh of node when changing rating (which is bad for current testing)
		const parent = GetNodeL3.Watch(SlicePath(path, 1));
		const combineWithParentArgument = IsPremiseOfSinglePremiseArgument.Watch(node, parent);
		// let ratingReversed = ShouldRatingTypeBeReversed(node);

		let mainRatingType = GetMainRatingType.Watch(node);
		let ratingNode = node;
		let ratingNodePath = path;
		if (combineWithParentArgument) {
			mainRatingType = 'impact';
			ratingNode = parent;
			ratingNodePath = SlicePath(path, 1);
		}
		/* const mainRating_average = UseSelector(() => GetRatingAverage_AtPath(ratingNode, mainRatingType));
		// let mainRating_mine = GetRatingValue(ratingNode._id, mainRatingType, MeID());
		const mainRating_mine = UseSelector(() => GetRatingAverage_AtPath(ratingNode, mainRatingType, new RatingFilter({ includeUser: MeID() }))); */

		const useReasonScoreValuesForThisNode = UseSelector(() => State(a => a.main.weighting) == WeightingType.ReasonScore && (node.type == MapNodeType.Argument || node.type == MapNodeType.Claim));
		if (useReasonScoreValuesForThisNode) {
			var reasonScoreValues = RS_GetAllValues.Watch(node, path, true) as ReasonScoreValues_RSPrefix;
		}

		// const backgroundFillPercent = UseSelector(() => GetFillPercent_AtPath(ratingNode, ratingNodePath, null));
		// const markerPercent = UseSelector(() => GetMarkerPercent_AtPath(ratingNode, ratingNodePath, null));
		// const backgroundFillPercent = UseSelector(() => GetFillPercent_AtPath(ratingNode, ratingNodePath, null));
		const backgroundFillPercent = /* A.NonNull = */ GetFillPercent_AtPath.Watch(ratingNode, ratingNodePath, null);
		const markerPercent = GetMarkerPercent_AtPath.Watch(ratingNode, ratingNodePath, null);

		const form = GetNodeForm.Watch(node, path);
		// const ratingsRoot = UseSelector(() => GetNodeRatingsRoot(node._key));
		const ratingsRoot = GetNodeRatingsRoot.Watch(node._key);
		const showReasonScoreValues = UseSelector(() => State(a => a.main.showReasonScoreValues));

		// the rest
		// ==========

		let [hovered, setHovered] = UseState(false);
		const [hoverPanel, setHoverPanel] = UseState(null as string);
		const [hoverTermID, setHoverTermID] = UseState(null as string);
		let [local_openPanel, setLocal_openPanel] = UseState(null as string);
		const [lastWidthWhenNotPreview, setLastWidthWhenNotPreview] = UseState(0);

		UseEffect(() => {
			/* const { dragInfo } = this.props;
			const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;
			if (!asDragPreview && this.draggableDiv) { */
			// setDragActive(this.root.DOM.getBoundingClientRect().width);
			if (this.root && this.root.DOM) {
				if (this.root.DOM.getBoundingClientRect().width != lastWidthWhenNotPreview) {
					setLastWidthWhenNotPreview(this.root.DOM.getBoundingClientRect().width);
				}
			}
		});

		const nodeTypeInfo = MapNodeType_Info.for[node.type];
		let backgroundColor = GetNodeColor(node);
		/* const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;
		// const offsetByAnotherDrag = dragInfo && dragInfo.provided.draggableProps.style.transform;
		if (asDragPreview) {
			hovered = false;
			local_openPanel = null;
		} */

		// Log(`${node._key} -- ${dragInfo && dragInfo.snapshot.isDragging}; ${dragInfo && dragInfo.snapshot.draggingOver}`);

		// const parent = GetParentNodeL3(path);
		const combinedWithParentArgument = IsPremiseOfSinglePremiseArgument(node, parent);
		if (combinedWithParentArgument) {
			backgroundColor = GetNodeColor(parent);
		}

		const outlineColor = GetChangeTypeOutlineColor(changeType);
		const barSize = 5;
		const pathNodeIDs = GetPathNodeIDs(path);
		const isSubnode = IsNodeSubnode(node);

		/* let backgroundFillPercent = mainRating_average || 0;
		let markerPercent = mainRating_mine;
		if (reasonScoreValues) {
			var {rs_argTruthScoreComposite, rs_argWeightMultiplier, rs_argWeight, rs_claimTruthScore, rs_claimBaseWeight} = reasonScoreValues;
			if (node.type == MapNodeType.Claim) {
				backgroundFillPercent = rs_claimTruthScore * 100;
				markerPercent = null;
			} else if (node.type == MapNodeType.Argument) {
				//backgroundFillPercent = Lerp(0, 100, GetPercentFromXToY(0, 2, rs_argWeightMultiplier));
				//backgroundFillPercent = Lerp(0, 100, GetPercentFromXToY(0, 2, rs_argWeight));
				backgroundFillPercent = rs_argTruthScoreComposite * 100;
				markerPercent = null;
			}

			// if background-fill-percent is 0, the data must still be loading
			if (IsNaN(backgroundFillPercent)) {
				backgroundFillPercent = 0;
			}
		} */

		const nodeReversed = form == ClaimForm.Negation;

		const leftPanelShow = (nodeView && nodeView.selected) || hovered; // || local_selected;
		const panelToShow = hoverPanel || local_openPanel || (nodeView && nodeView.openPanel);
		const subPanelShow = node.type == MapNodeType.Claim && (node.current.contentNode || node.current.image);
		const bottomPanelShow = leftPanelShow && panelToShow;
		const expanded = nodeView && nodeView.expanded;

		const onMouseEnter = UseCallback(() => {
			setHovered(true);
			this.checkStillHoveredTimer.Start();
		}, [setHovered]);
		const onMouseLeave = UseCallback(() => {
			setHovered(false);
			this.checkStillHoveredTimer.Stop();
		}, [setHovered]);
		const onClick = UseCallback((e) => {
			if ((e.nativeEvent as any).ignore) return;
			/* if (useLocalPanelState) {
				this.SetState({local_selected: true});
				return;
			} */

			if (nodeView == null || !nodeView.selected) {
				store.dispatch(new ACTMapNodeSelect({ mapID: map._key, path }));
			}
		}, [map._key, nodeView, path]);
		const onDirectClick = UseCallback((e) => {
			if (combinedWithParentArgument) {
				store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: parent && parent._key, time: Date.now() }));
			}
			store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: node._key, time: Date.now() }));
		}, [combinedWithParentArgument, node._key, parent]);
		const onTextHolderClick = UseCallback(e => IsDoubleClick(e) && this.titlePanel && this.titlePanel.OnDoubleClick(), []);
		const toggleExpanded = UseCallback((e) => {
			store.dispatch(new ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: !expanded, recursive: expanded && e.altKey }));
			e.nativeEvent['ignore'] = true; // for some reason, "return false" isn't working
			// return false;
		}, [expanded, map._key, path]);

		const renderInner = (dragInfo) => {
			const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;
			// const offsetByAnotherDrag = dragInfo && dragInfo.provided.draggableProps.style.transform;
			if (asDragPreview) {
				hovered = false;
				local_openPanel = null;
			}
			return (
				<ExpandableBox ref={c => DoNothing(dragInfo && dragInfo.provided.innerRef(GetDOM(c) as any), this.root = c)}
					{...{ width, widthOverride, outlineColor, expanded }} parent={this}
					className={classNames('NodeUI_Inner', asDragPreview && 'DragPreview', { root: pathNodeIDs.length == 0 })}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
					{...(dragInfo && dragInfo.provided.draggableProps)} // {...(dragInfo && dragInfo.provided.dragHandleProps)} // drag-handle is attached to just the TitlePanel, below
					style={E(
						style,
						dragInfo && dragInfo.provided.draggableProps.style,
						asDragPreview && { zIndex: 10 },
					)}
					padding={GetPaddingForNode(node, isSubnode)}
					onClick={onClick}
					onDirectClick={onDirectClick}
					beforeChildren={<>
						{leftPanelShow &&
						<MapNodeUI_LeftBox {...{ map, path, node, nodeView, ratingsRoot, panelPosition, local_openPanel, backgroundColor }} asHover={hovered}
							onPanelButtonHover={panel => setHoverPanel(panel)}
							onPanelButtonClick={(panel) => {
								if (useLocalPanelState) {
									setLocal_openPanel(panel);
									setHoverPanel(null);
									return;
								}

								if (nodeView.openPanel != panel) {
									store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel }));
								} else {
									store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel: null }));
									setHoverPanel(null);
								}
							}}>
							{/* fixes click-gap */}
							{panelPosition == 'below' && <div style={{ position: 'absolute', right: -1, width: 1, top: 0, bottom: 0 }}/>}
						</MapNodeUI_LeftBox>}
						{/* fixes click-gap */}
						{leftPanelShow && panelPosition == 'left' && <div style={{ position: 'absolute', right: '100%', width: 1, top: 0, bottom: 0 }}/>}
					</>}
					onTextHolderClick={onTextHolderClick}
					text={<>
						<TitlePanel {...{ indexInNodeList, parent: this, map, node, nodeView, path }} {...(dragInfo && dragInfo.provided.dragHandleProps)}
							ref={c => this.titlePanel = c}
							// exposer={a => this.titlePanel = a}
							style={E(GADDemo && { color: HSLA(222, 0.33, 0.25, 1), fontFamily: 'TypoPRO Bebas Neue', fontSize: 15, letterSpacing: 1 })}/>
						{subPanelShow && <SubPanel node={node}/>}
						<NodeUI_Menu_Stub {...{ map, node, path }}/>
					</>}
					{...E(
						{ backgroundFillPercent, backgroundColor, markerPercent },
						GADDemo && { backgroundFillPercent: 100, backgroundColor: chroma(HSLA(0, 0, 1)) as Color },
					)}
					toggleExpanded={toggleExpanded}
					afterChildren={<>
						{bottomPanelShow
							&& <NodeUI_BottomPanel {...{ map, node, nodeView, path, parent, width, widthOverride, panelPosition, panelToShow, hovered, backgroundColor }}
								hoverTermID={hoverTermID} onTermHover={termID => setHoverTermID(termID)}/>}
						{reasonScoreValues && showReasonScoreValues
							&& <ReasonScoreValueMarkers {...{ node, combinedWithParentArgument, reasonScoreValues }}/>}
					</>}
				/>
			);
		};

		/* if (asDragPreview) {
			return ReactDOM.createPortal(result, portal);
		} */
		// return result;

		this.Stash({ setHovered });

		const GetDNDProps = () => {
			if (!IsUserCreatorOrMod(MeID(), node)) return null;
			if (!path.includes('/')) return null; // don't make draggable if root-node of map
			return {
				type: 'MapNode',
				draggableInfo: new DraggableInfo({ nodePath: path }),
				index: indexInNodeList,
			};
		};
		const dndProps = GetDNDProps();
		if (dndProps == null) {
			return renderInner(null);
		}

		const draggableID = ToJSON(dndProps.draggableInfo);
		return (
			<>
				{/* <div>asDragPreview: {asDragPreview}</div> */}
				<Draggable type={dndProps.type} key={draggableID} draggableId={draggableID} index={dndProps.index}>
					{(provided, snapshot) => {
						const dragInfo = { provided, snapshot };
						const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;

						// if drag preview, we have to put in portal, since otherwise the "filter" effect of ancestors causes the {position:fixed} style to not be relative-to-page
						if (asDragPreview) return ReactDOM.createPortal(renderInner(dragInfo), portal);
						return renderInner(dragInfo);
					}}
				</Draggable>
				<div style={{ width: lastWidthWhenNotPreview }}/>
			</>
		);
	}
	definitionsPanel: DefinitionsPanel;
	/* ComponentDidMount() {
		// we have to use native/jquery hover/mouseenter+mouseleave, to fix that in-equation term-placeholders would cause "mouseleave" to be triggered
		const dom = $(GetDOM(this));
		// dom.off("mouseenter mouseleave");
		$(dom).hover(() => {
			if ($('.scrolling').length == 0) {
				this.SetState({ hovered: true });
			}
		}, () => {
			this.SetState({ hovered: false });
		});
	} */
}

let portal: HTMLElement;
WaitXThenRun(0, () => {
	portal = document.createElement('div');
	document.body.appendChild(portal);
});

class NodeUI_BottomPanel extends BaseComponent
		<{
			map: Map, node: MapNodeL3, nodeView: MapNodeView, path: string, parent: MapNodeL3,
			width: number, widthOverride: number, panelPosition: 'left' | 'below', panelToShow: string, hovered: boolean, hoverTermID: string, onTermHover: (id: string)=>void,
			backgroundColor: Color,
		}, {hoverTermID: string}> {
	render() {
		const {
			map, node, nodeView, path, parent,
			width, widthOverride, panelPosition, panelToShow, hovered, hoverTermID, onTermHover,
			backgroundColor,
		} = this.props;
		return (
			<ErrorBoundary>
				<div style={{
					position: 'absolute', left: panelPosition == 'below' ? 130 + 1 : 0, top: 'calc(100% + 1px)',
					width, minWidth: (widthOverride | 0).KeepAtLeast(550), zIndex: hovered ? 6 : 5,
					padding: 5, background: backgroundColor.css(), borderRadius: 5, boxShadow: 'rgba(0,0,0,1) 0px 0px 2px',
				}}>
					{ratingTypes.Contains(panelToShow) && (() => {
						if (['impact', 'relevance'].Contains(panelToShow) && node.type == MapNodeType.Claim) {
							const argumentNode = parent;
							const argumentPath = SlicePath(path, 1);
							const ratings = GetRatings(argumentNode._key, panelToShow as RatingType);
							return <RatingsPanel node={argumentNode} path={argumentPath} ratingType={panelToShow as RatingType} ratings={ratings}/>;
						}
						const ratings = GetRatings(node._key, panelToShow as RatingType);
						return <RatingsPanel node={node} path={path} ratingType={panelToShow as RatingType} ratings={ratings}/>;
					})()}
					{panelToShow == 'definitions' &&
						<DefinitionsPanel ref={c => this.definitionsPanel = c} {...{ node, path, hoverTermID }}
							openTermID={nodeView.openTermID}
							onHoverTerm={termID => onTermHover(termID)}
							onClickTerm={termID => store.dispatch(new ACTMapNodeTermOpen({ mapID: map._key, path, termID }))}/>}
					{panelToShow == 'phrasings' && <PhrasingsPanel node={node} path={path}/>}
					{panelToShow == 'discussion' && <DiscussionPanel/>}
					{panelToShow == 'social' && <SocialPanel/>}
					{panelToShow == 'tags' && <TagsPanel/>}
					{panelToShow == 'details' && <DetailsPanel map={map} node={node} path={path}/>}
					{panelToShow == 'history' && <HistoryPanel map={map} node={node} path={path}/>}
					{panelToShow == 'others' && <OthersPanel map={map} node={node} path={path}/>}
				</div>
			</ErrorBoundary>
		);
	}
	definitionsPanel: DefinitionsPanel;
}

class ReasonScoreValueMarkers extends BaseComponent<{node: MapNodeL3, reasonScoreValues: ReasonScoreValues_RSPrefix, combinedWithParentArgument: boolean}, {}> {
	render() {
		const { node, reasonScoreValues, combinedWithParentArgument } = this.props;
		const mainScore = node.type == MapNodeType.Argument ? RS_CalculateTruthScoreComposite(node) : RS_CalculateTruthScore(node);
		const { rs_argTruthScoreComposite, rs_argWeightMultiplier, rs_argWeight, rs_claimTruthScore, rs_claimBaseWeight } = reasonScoreValues;
		return (
			<div className="clickThrough" style={{ position: 'absolute', top: '100%', width: '100%', zIndex: 1, textAlign: 'center', fontSize: 14 }}>
				{node.type == MapNodeType.Argument && `Truth score: ${mainScore.ToPercentStr()}${
					` Weight: [...]x${rs_argWeightMultiplier.RoundTo_Str(0.01)} = ${rs_argWeight.RoundTo_Str(0.01)}`
				}`}
				{node.type == MapNodeType.Claim && `Truth score: ${mainScore.ToPercentStr()}${
					combinedWithParentArgument
						? ` Weight: ${rs_claimBaseWeight.RoundTo_Str(0.01)}x${rs_argWeightMultiplier.RoundTo_Str(0.01)} = ${rs_argWeight.RoundTo_Str(0.01)}`
						: ''
				}`}
			</div>
		);
	}
}
