import classNames from 'classnames';
import keycode from 'keycode';
import { Button, Pre, Row, TextArea } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, GetInnerComp, GetDOM, FindReact } from 'react-vextensions';
import { ReasonScoreValues_RSPrefix, RS_CalculateTruthScore, RS_CalculateTruthScoreComposite, RS_GetAllValues } from 'Store/firebase/nodeRatings/ReasonScore';
import { IsUserCreatorOrMod, HasModPermissions } from 'Store/firebase/userExtras';
import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { GetTimeFromWhichToShowChangedNodes } from 'Store/main/maps/$map';
import { NodeMathUI } from 'UI/@Shared/Maps/MapNode/NodeMathUI';
import { SetNodeUILocked } from 'UI/@Shared/Maps/MapNode/NodeUI';
import { SlicePath, State, Connect, IsDoubleClick, InfoButton, RemoveHelpers, DBPath, WaitTillPathDataIsReceived, VReactMarkdown_Remarkable, DragInfo, MakeDraggable } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { Clone, Assert, Timer, VRect, Vector2i, WaitXThenRun } from 'js-vextensions';
import { DraggableInfo } from 'Utils/UI/DNDStructures';
import ReactDOM from 'react-dom';
import { Fragment } from 'react';
import { GetPathNodeIDs } from 'Store/main/mapViews';
import { ParseSegmentsForPatterns } from '../../../../Utils/General/RegexHelpers';
import { AddNodeRevision } from '../../../../Server/Commands/AddNodeRevision';
import { GetImage } from '../../../../Store/firebase/images';
import { ChangeType, GetChangeTypeOutlineColor } from '../../../../Store/firebase/mapNodeEditTimes';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { GetFillPercent_AtPath, GetMarkerPercent_AtPath, GetNodeRatingsRoot, GetRatingAverage_AtPath, GetRatings, RatingFilter } from '../../../../Store/firebase/nodeRatings';
import { RatingType, ratingTypes } from '../../../../Store/firebase/nodeRatings/@RatingType';
import { GetParentNode, GetParentNodeL3, IsNodeSubnode } from '../../../../Store/firebase/nodes';
import { GetFontSizeForNode, GetMainRatingType, GetNodeDisplayText, GetNodeForm, GetNodeL3, GetPaddingForNode, IsPremiseOfSinglePremiseArgument, missingTitleStrings } from '../../../../Store/firebase/nodes/$node';
import { GetEquationStepNumber } from '../../../../Store/firebase/nodes/$node/equation';
import { ClaimForm, MapNodeL2, MapNodeL3 } from '../../../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision_titlePattern } from '../../../../Store/firebase/nodes/@MapNodeRevision';
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
import { RatingsPanel } from './NodeUI/Panels/RatingsPanel';
import { SocialPanel } from './NodeUI/Panels/SocialPanel';
import { TagsPanel } from './NodeUI/Panels/TagsPanel';
import { SubPanel } from './NodeUI_Inner/SubPanel';
import { TermPlaceholder } from './NodeUI_Inner/TermPlaceholder';
import { MapNodeUI_LeftBox } from './NodeUI_LeftBox';
import { NodeUI_Menu, NodeUI_Menu_Stub } from './NodeUI_Menu';
import { PhrasingsPanel } from './NodeUI/Panels/PhrasingsPanel';

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
const connector = (state, { map, node, path }: Props) => {
	let sinceTime = GetTimeFromWhichToShowChangedNodes(map._key);
	/* let pathsToChangedNodes = GetPathsToNodesChangedSinceX(map._id, sinceTime);
	let ownNodeChanged = pathsToChangedNodes.Any(a=>a.split("/").Any(b=>b == node._id));
	let changeType = ownNodeChanged ? GetNodeChangeType(node, sinceTime) : null; */

	const lastAcknowledgementTime = GetLastAcknowledgementTime(node._key);
	sinceTime = sinceTime.KeepAtLeast(lastAcknowledgementTime);

	let changeType: ChangeType;
	if (node.createdAt > sinceTime) changeType = ChangeType.Add;
	else if (node.current.createdAt > sinceTime) changeType = ChangeType.Edit;

	const parent = GetNodeL3(SlicePath(path, 1));
	const combineWithParentArgument = IsPremiseOfSinglePremiseArgument(node, parent);
	// let ratingReversed = ShouldRatingTypeBeReversed(node);

	let mainRatingType = GetMainRatingType(node);
	let ratingNode = node;
	let ratingNodePath = path;
	if (combineWithParentArgument) {
		mainRatingType = 'impact';
		ratingNode = parent;
		ratingNodePath = SlicePath(path, 1);
	}
	const mainRating_average = GetRatingAverage_AtPath(ratingNode, mainRatingType);
	// let mainRating_mine = GetRatingValue(ratingNode._id, mainRatingType, MeID());
	const mainRating_mine = GetRatingAverage_AtPath(ratingNode, mainRatingType, new RatingFilter({ includeUser: MeID() }));

	const useReasonScoreValuesForThisNode = State(a => a.main.weighting) == WeightingType.ReasonScore && (node.type == MapNodeType.Argument || node.type == MapNodeType.Claim);
	if (useReasonScoreValuesForThisNode) {
		var reasonScoreValues = RS_GetAllValues(node, path, true) as ReasonScoreValues_RSPrefix;
	}

	const backgroundFillPercent = GetFillPercent_AtPath(ratingNode, ratingNodePath, null);
	const markerPercent = GetMarkerPercent_AtPath(ratingNode, ratingNodePath, null);

	return {
		form: GetNodeForm(node, path),
		ratingsRoot: GetNodeRatingsRoot(node._key),
		mainRating_average,
		mainRating_mine,
		reasonScoreValues,
		showReasonScoreValues: State(a => a.main.showReasonScoreValues),
		changeType,
		backgroundFillPercent,
		markerPercent,
	};
};

@Connect(connector)
@MakeDraggable(({ node, path, indexInNodeList }: TitlePanelProps) => {
	if (!IsUserCreatorOrMod(MeID(), node)) return null;
	if (!path.includes('/')) return null; // don't make draggable if root-node of map
	return {
		type: 'MapNode',
		draggableInfo: new DraggableInfo({ nodePath: path }),
		index: indexInNodeList,
	};
})
export class NodeUI_Inner extends BaseComponentWithConnector(connector,
	{ hovered: false, hoverPanel: null as string, hoverTermID: null as string, /* local_selected: boolean, */ local_openPanel: null as string }) {
	static defaultProps = { panelPosition: 'left' };

	root: ExpandableBox;
	titlePanel: TitlePanel;
	checkStillHoveredTimer = new Timer(100, () => {
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
		this.SetState({ hovered: intersectsOne });
	});

	render() {
		const { indexInNodeList, map, node, nodeView, path, width, widthOverride,
			panelPosition, useLocalPanelState, style, form,
			ratingsRoot, mainRating_average, mainRating_mine, reasonScoreValues,
			showReasonScoreValues, changeType, backgroundFillPercent, markerPercent, dragInfo } = this.props;
		let { hovered, hoverPanel, hoverTermID, /* local_selected, */ local_openPanel } = this.state;
		const nodeTypeInfo = MapNodeType_Info.for[node.type];
		let backgroundColor = GetNodeColor(node);
		const asDragPreview = dragInfo && dragInfo.snapshot.isDragging;
		// const offsetByAnotherDrag = dragInfo && dragInfo.provided.draggableProps.style.transform;
		if (asDragPreview) {
			hovered = false;
			local_openPanel = null;
		}

		// Log(`${node._key} -- ${dragInfo && dragInfo.snapshot.isDragging}; ${dragInfo && dragInfo.snapshot.draggingOver}`);

		const parent = GetParentNodeL3(path);
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

		const result = (
			<ExpandableBox ref={c => this.root = c}
				{...{ width, widthOverride, outlineColor, expanded }} parent={this}
				className={classNames('NodeUI_Inner', asDragPreview && 'DragPreview', { root: pathNodeIDs.length == 0 })}
				onMouseEnter={() => {
					this.SetState({ hovered: true });
					this.checkStillHoveredTimer.Start();
				}}
				onMouseLeave={() => {
					this.SetState({ hovered: false });
					this.checkStillHoveredTimer.Stop();
				}}
				{...(dragInfo && dragInfo.provided.draggableProps)} {...(dragInfo && dragInfo.provided.dragHandleProps)}
				style={E(
					style,
					dragInfo && dragInfo.provided.draggableProps.style,
					asDragPreview && { zIndex: 10 },
				)}
				padding={GetPaddingForNode(node, isSubnode)}
				onClick={(e) => {
					if ((e.nativeEvent as any).ignore) return;
					/* if (useLocalPanelState) {
						this.SetState({local_selected: true});
						return;
					} */

					if (nodeView == null || !nodeView.selected) {
						store.dispatch(new ACTMapNodeSelect({ mapID: map._key, path }));
					}
				}}
				onDirectClick={(e) => {
					if (combinedWithParentArgument) {
						store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: parent._key, time: Date.now() }));
					}
					store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: node._key, time: Date.now() }));
				}}
				beforeChildren={[
					leftPanelShow
						&& <MapNodeUI_LeftBox {...{ map, path, node, nodeView, ratingsRoot, panelPosition, local_openPanel, backgroundColor }} asHover={hovered}
							onPanelButtonHover={panel => this.SetState({ hoverPanel: panel })}
							onPanelButtonClick={(panel) => {
								if (useLocalPanelState) {
									this.SetState({ local_openPanel: panel, hoverPanel: null });
									return;
								}

								if (nodeView.openPanel != panel) {
									store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel }));
								} else {
									store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel: null }));
									this.SetState({ hoverPanel: null });
								}
							}}>
							{/* fixes click-gap */}
							{panelPosition == 'below' && <div style={{ position: 'absolute', right: -1, width: 1, top: 0, bottom: 0 }}/>}
						</MapNodeUI_LeftBox>,
					// fixes click-gap
					leftPanelShow && panelPosition == 'left' && <div style={{ position: 'absolute', right: '100%', width: 1, top: 0, bottom: 0 }}/>,
				].AutoKey()}
				onTextHolderClick={e => IsDoubleClick(e) && this.titlePanel && this.titlePanel.OnDoubleClick()}
				text={[
					/* eslint-disable react/jsx-key */
					<TitlePanel {...{ indexInNodeList, parent: this, map, node, nodeView, path }} ref={c => this.titlePanel = c}/>,
					subPanelShow && <SubPanel node={node}/>,
					<NodeUI_Menu_Stub {...{ map, node, path }}/>,
					/* eslint-enable react/jsx-key */
				].AutoKey()}
				{...{ backgroundFillPercent, backgroundColor, markerPercent }}
				toggleExpanded={(e) => {
					store.dispatch(new ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: !expanded, recursive: expanded && e.altKey }));
					e.nativeEvent['ignore'] = true; // for some reason, "return false" isn't working
					// return false;
				}}
				afterChildren={[
					bottomPanelShow
						&& <NodeUI_BottomPanel {...{ map, node, nodeView, path, parent, width, widthOverride, panelPosition, panelToShow, hovered, backgroundColor }}
							hoverTermID={hoverTermID} onTermHover={termID => this.SetState({ hoverTermID: termID })}/>,
					reasonScoreValues && showReasonScoreValues
						&& <ReasonScoreValueMarkers {...{ node, combinedWithParentArgument, reasonScoreValues }}/>,
				].AutoKey()}
			/>
		);

		// if drag preview, we have to put in portal, since otherwise the "filter" effect of ancestors causes the {position:fixed} style to not be relative-to-page
		if (asDragPreview) {
			return ReactDOM.createPortal(result, portal);
	  }
	  return result;
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
				{node.type == MapNodeType.Argument && `Truth score: ${ToPercentStr(mainScore)}${
					` Weight: [...]x${rs_argWeightMultiplier.RoundTo_Str(0.01)} = ${rs_argWeight.RoundTo_Str(0.01)}`
				}`}
				{node.type == MapNodeType.Claim && `Truth score: ${ToPercentStr(mainScore)}${
					combinedWithParentArgument
						? ` Weight: ${rs_claimBaseWeight.RoundTo_Str(0.01)}x${rs_argWeightMultiplier.RoundTo_Str(0.01)} = ${rs_argWeight.RoundTo_Str(0.01)}`
						: ''
				}`}
			</div>
		);
	}
}

type TitlePanelProps = {parent: NodeUI_Inner, map: Map, node: MapNodeL2, nodeView: MapNodeView, path: string, indexInNodeList: number};
const TitlePanel_connector = (state, { node, path }: TitlePanelProps) => ({
	displayText: GetNodeDisplayText(node, path),
	$1: node.current.image && GetImage(node.current.image.id),
	equationNumber: node.current.equation ? GetEquationStepNumber(path) : null,
});
@Connect(TitlePanel_connector)
class TitlePanel extends BaseComponentWithConnector(TitlePanel_connector, { editing: false, newTitle: null as string, applyingEdit: false }) {
	OnDoubleClick() {
		const { node } = this.props;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), node);
		if (creatorOrMod && node.current.equation == null) {
			this.SetState({ editing: true });
		}
	}
	render() {
		const { map, node, nodeView, path, displayText, equationNumber } = this.props;
		const latex = node.current.equation && node.current.equation.latex;
		const isSubnode = IsNodeSubnode(node);

		let { editing, newTitle, applyingEdit } = this.state;
		newTitle = newTitle != null ? newTitle : displayText;

		const noteText = (node.current.equation && node.current.equation.explanation) || node.current.note;

		return (
			// <Row style={{position: "relative"}}>
			<div style={{ position: 'relative' }} onClick={e => IsDoubleClick(e) && this.OnDoubleClick()}>
				{equationNumber != null &&
					<Pre>{equationNumber}) </Pre>}
				{!editing &&
					<span style={E(
						{ position: 'relative', fontSize: GetFontSizeForNode(node, isSubnode), whiteSpace: 'initial' },
						isSubnode && { margin: '4px 0 1px 0' },
						missingTitleStrings.Contains(newTitle) && { color: 'rgba(255,255,255,.3)' },
					)}>
						{latex && <NodeMathUI text={node.current.equation.text} onTermHover={this.OnTermHover} onTermClick={this.OnTermClick}/>}
						{!latex && this.RenderNodeDisplayText(newTitle)}
					</span>}
				{editing &&
					<Row style={E(
						{ position: 'relative', fontSize: GetFontSizeForNode(node, isSubnode), whiteSpace: 'initial', alignItems: 'stretch' },
						isSubnode && { margin: '4px 0 1px 0' },
					)}>
						{!applyingEdit &&
							<TextArea required={true} pattern={MapNodeRevision_titlePattern} allowLineBreaks={false} autoSize={true} style={ES({ flex: 1 })}
								ref={a => a && a.DOM_HTML.focus()}
								onKeyDown={(e) => {
									if (e.keyCode == keycode.codes.esc) {
										this.SetState({ editing: false });
									} else if (e.keyCode == keycode.codes.enter) {
										this.ApplyEdit();
									}
								}}
								value={newTitle} onChange={val => this.SetState({ newTitle: val })}/>}
						{!applyingEdit &&
							<Button enabled={newTitle.match(MapNodeRevision_titlePattern) != null} text="✔️" p="0 3px" style={{ borderRadius: '0 5px 5px 0' }}
								onClick={() => this.ApplyEdit()}/>}
						{applyingEdit && <Row>Applying edit...</Row>}
					</Row>}
				{noteText &&
					<Pre style={{
						fontSize: 11, color: 'rgba(255,255,255,.5)',
						// marginLeft: "auto",
						marginLeft: 15, marginTop: 3, float: 'right',
					}}>
						{noteText}
					</Pre>}
				{node.type == MapNodeType.Claim && node.current.contentNode &&
					<InfoButton text="Allowed exceptions are: bold and [...] (collapsed segments)"/>}
			</div>
		);
	}

	async ApplyEdit() {
		const { map, node, nodeView, path, equationNumber } = this.props;
		const { editing, newTitle, applyingEdit } = this.state;

		this.SetState({ applyingEdit: true });

		const parentNode = GetParentNode(path);

		const form = GetNodeForm(node, path);
		const titleKey = { [ClaimForm.Negation]: 'negation', [ClaimForm.YesNoQuestion]: 'yesNoQuestion' }[form] || 'base';
		const newRevision = Clone(node.current);
		if (newRevision.titles[titleKey] != newTitle) {
			newRevision.titles[titleKey] = newTitle;

			SetNodeUILocked(parentNode._key, true);
			const revisionID = await new AddNodeRevision({ mapID: map._key, revision: RemoveHelpers(newRevision) }).Run();
			store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: node._key, time: Date.now() }));
			// await WaitTillPathDataIsReceiving(DBPath(`nodeRevisions/${revisionID}`));
			await WaitTillPathDataIsReceived(DBPath(`nodeRevisions/${revisionID}`));
			SetNodeUILocked(parentNode._key, false);
		}
		this.SetState({ applyingEdit: false, editing: false });
	}

	OnTermHover(termID: string, hovered: boolean) {
		const { parent } = this.props;
		parent.SetState({ hoverPanel: hovered ? 'definitions' : null, hoverTermID: hovered ? termID : null });
	}
	OnTermClick(termID: string) {
		const { parent, map, path } = this.props;
		// parent.SetState({hoverPanel: "definitions", hoverTermID: termID});
		store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel: 'definitions' }));
		store.dispatch(new ACTMapNodeTermOpen({ mapID: map._key, path, termID }));
	}

	RenderNodeDisplayText(text: string) {
		const { parent, map, path } = this.props;

		// let segments = ParseSegmentsFromNodeDisplayText(text);
		const segments = ParseSegmentsForPatterns(text, [
			{ name: 'term', regex: /{(.+?)\}\[(.+?)\]/ },
		]);

		const elements = [];
		for (const [index, segment] of segments.entries()) {
			if (segment.patternMatched == null) {
				const segmentText = segment.textParts[0];
				const edgeWhiteSpaceMatch = segmentText.match(/^( *).*?( *)$/);
				if (edgeWhiteSpaceMatch[1]) elements.push(<span key={elements.length}>{edgeWhiteSpaceMatch[1]}</span>);
				elements.push(
					<VReactMarkdown_Remarkable key={elements.length} containerType="span" source={segmentText}
						rendererOptions={{
							components: {
								p: props => <span>{props.children}</span>,
							},
						}}/>,
				);
				if (edgeWhiteSpaceMatch[2]) elements.push(<span key={elements.length}>{edgeWhiteSpaceMatch[2]}</span>);
			} else if (segment.patternMatched == 'term') {
				const refText = segment.textParts[1];
				const termID = segment.textParts[2];
				elements.push(
					<TermPlaceholder key={elements.length} refText={refText} termID={termID}
						onHover={hovered => this.OnTermHover(termID, hovered)} onClick={() => this.OnTermClick(termID)}/>,
				);
			} else {
				Assert(false);
			}
		}
		return elements;
	}
}
