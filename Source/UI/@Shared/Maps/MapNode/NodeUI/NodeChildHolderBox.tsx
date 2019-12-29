import chroma from 'chroma-js';
import { AssertWarn, emptyArray, emptyArray_forLoading, E } from 'js-vextensions';
import { Row } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM, UseCallback, WarnOfTransientObjectProps } from 'react-vextensions';
import { GetMarkerPercent_AtPath, GetRatings } from 'Store/firebase/nodeRatings';
import { RatingType } from 'Store/firebase/nodeRatings/@RatingType';
import { GetParentNodeL3, HolderType } from 'Store/firebase/nodes';
import { IsSinglePremiseArgument } from 'Store/firebase/nodes/$node';
import { MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { GADDemo } from 'UI/@GAD/GAD';
import { HSLA, Observer } from 'vwebapp-framework';
import { ACTMapNodeExpandedSet, GetNodeView, MapNodeView } from 'Store/main/maps/mapViews/$mapView';
import { runInAction } from 'mobx';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { GetFillPercent_AtPath } from '../../../../../Store/firebase/nodeRatings';
import { IsMultiPremiseArgument, IsPremiseOfSinglePremiseArgument } from '../../../../../Store/firebase/nodes/$node';
import { GetNodeColor } from '../../../../../Store/firebase/nodes/@MapNodeType';
import { ExpandableBox } from '../ExpandableBox';
import { Squiggle } from '../NodeConnectorBackground';
import { NodeUI_Menu_Stub } from '../NodeUI_Menu';
import { NodeChildCountMarker } from './NodeChildCountMarker';
import { NodeChildHolder } from './NodeChildHolder';
import { RatingsPanel } from './Panels/RatingsPanel';

type Props = {
	map: Map, node: MapNodeL3, path: string, nodeChildren: MapNodeL3[], nodeChildrenToShow: MapNodeL3[],
	type: HolderType, widthOfNode: number, widthOverride?: number, onHeightOrDividePointChange?: (dividePoint: number)=>void,
};

@WarnOfTransientObjectProps
@Observer
export class NodeChildHolderBox extends BaseComponentPlus({} as Props, { innerBoxOffset: 0, lineHolderHeight: 0, hovered: false, hovered_button: false }) {
	static ValidateProps(props: Props) {
		const { node, nodeChildren } = props;
		// ms only asserts in dev for now (and only as warning); causes error sometimes when cut+pasting otherwise (firebase doesn`t send DB updates atomically?)
		if (DEV) {
			AssertWarn(nodeChildren.every((a) => a == null || (a.parents || {})[node._key] != null), 'Supplied node is not a parent of all the supplied node-children!');
		}
	}
	lineHolder: HTMLDivElement;
	render() {
		const { map, node, path, nodeChildren, nodeChildrenToShow, type, widthOfNode, widthOverride } = this.props;
		const { innerBoxOffset, lineHolderHeight, hovered, hovered_button } = this.state;

		// const nodeView = GetNodeView(map._key, path) ?? new MapNodeView();
		// const nodeView = GetNodeView(map._key, path, true);
		const nodeView = GetNodeView(map._key, path);
		const parent = GetParentNodeL3(path);
		const combineWithParentArgument = IsPremiseOfSinglePremiseArgument(node, parent);

		const backgroundFillPercent = GetFillPercent_AtPath(node, path, type);
		const markerPercent = GetMarkerPercent_AtPath(node, path, type);

		const isMultiPremiseArgument = IsMultiPremiseArgument(node);
		let text = type == HolderType.Truth ? 'True?' : 'Relevant?';
		if (isMultiPremiseArgument) {
			text = 'When taken together, are these claims relevant?';
		}
		// let backgroundColor = chroma(`rgb(40,60,80)`) as Color;
		const backgroundColor = GetNodeColor({ type: MapNodeType.Claim } as any as MapNodeL3);
		// let lineColor = GetNodeColor(node, "raw");
		const lineColor = GetNodeColor({ type: MapNodeType.Claim } as any as MapNodeL3, 'raw');

		const lineOffset = 50.0.KeepAtMost(innerBoxOffset);
		// let expandKey = type == HolderType.Truth ? "expanded_truth" : "expanded_relevance";
		const holderTypeStr = HolderType[type].toLowerCase();
		const expandKey = `expanded_${holderTypeStr}`;
		const expanded = nodeView[expandKey]; // this.Expanded

		const separateChildren = node.type == MapNodeType.Claim || IsSinglePremiseArgument(node);
		const showArgumentsControlBar = /* (node.type == MapNodeType.Claim || combineWithChildClaim) && */ expanded && nodeChildrenToShow != emptyArray_forLoading;

		let { width, height } = this.GetMeasurementInfo();
		if (widthOverride) {
			width = widthOverride;
		}

		const hovered_main = hovered && !hovered_button;
		const ratingPanelShow = (nodeView && nodeView[`selected_${holderTypeStr}`]) || hovered_main; // || local_selected;

		return (
			<Row className="clickThrough" style={E(
				{ position: 'relative', alignItems: 'flex-start' },
				//! isMultiPremiseArgument && {alignSelf: "flex-end"},
				!isMultiPremiseArgument && { left: `calc(${widthOfNode}px - ${width}px)` },
				isMultiPremiseArgument && { marginTop: 10, marginBottom: 5 },
				// if we don't know our inner-box-offset yet, render still (so we can measure ourself), but make self invisible
				expanded && nodeChildrenToShow.length && innerBoxOffset == 0 && { opacity: 0, pointerEvents: 'none' },
			)}>
				<Row className="clickThrough" style={E(
					{ /* position: "relative", /* removal fixes */ alignItems: 'flex-start', /* marginLeft: `calc(100% - ${width}px)`, */ width },
				)}>
					<div ref={(c) => this.lineHolder = c} className="clickThroughChain" style={{ position: 'absolute', width: '100%', height: '100%' }}>
						{type == HolderType.Truth &&
							<Squiggle start={[0, lineHolderHeight + 2]} startControl_offset={[0, -lineOffset]}
								end={[(width / 2) - 2, innerBoxOffset + height - 2]} endControl_offset={[0, lineOffset]} color={lineColor}/>}
						{type == HolderType.Relevance && !isMultiPremiseArgument &&
							<Squiggle start={[0, -2]} startControl_offset={[0, lineOffset]}
								end={[(width / 2) - 2, innerBoxOffset + 2]} endControl_offset={[0, -lineOffset]} color={lineColor}/>}
						{type == HolderType.Relevance && isMultiPremiseArgument &&
							<div style={{ position: 'absolute', right: '100%', width: 10, top: innerBoxOffset + (height / 2) - 2, height: 3, backgroundColor: lineColor.css() }}/>}
					</div>
					<ExpandableBox {...{ width, widthOverride, expanded }} innerWidth={width}
						ref={(c) => this.expandableBox = c}
						style={{ marginTop: innerBoxOffset }}
						padding="3px 5px 2px"
						text={<span style={E(
							{ position: 'relative', fontSize: 13 },
							GADDemo && { color: HSLA(222, 0.33, 0.25, 1), fontFamily: 'TypoPRO Bebas Neue', fontSize: 15, letterSpacing: 1 },
						)}>{text}</span>}
						{...E(
							{ backgroundFillPercent, backgroundColor, markerPercent },
							GADDemo && { backgroundFillPercent: 100, backgroundColor: chroma(HSLA(0, 0, 1)) as Color },
						)}
						toggleExpanded={UseCallback((e) => {
							const newExpanded = !nodeView[expandKey];
							const recursivelyCollapsing = !newExpanded && e.altKey;
							runInAction('NodeChildHolderBox_toggleExpanded', () => {
								if (type == HolderType.Truth) {
									ACTMapNodeExpandedSet({
										mapID: map._key, path, resetSubtree: recursivelyCollapsing,
										[expandKey]: newExpanded,
									});
								} else {
									ACTMapNodeExpandedSet({
										mapID: map._key, path, resetSubtree: false,
										[expandKey]: newExpanded,
									});
									if (recursivelyCollapsing) {
										for (const child of nodeChildrenToShow) {
											ACTMapNodeExpandedSet({
												mapID: map._key, path: `${path}/${child._key}`, resetSubtree: true,
												[expandKey]: newExpanded,
											});
										}
									}
								}
							});
							e.nativeEvent['ignore'] = true; // for some reason, "return false" isn't working
							// return false;
							if (nodeView[expandKey]) {
								this.CheckForChanges();
							}
						}, [expandKey, map._key, nodeChildrenToShow, nodeView, path, type])}
						afterChildren={<>
							{ratingPanelShow &&
								<div ref={(c) => this.ratingPanelHolder = c} style={{
									position: 'absolute', left: 0, top: 'calc(100% + 1px)',
									width, minWidth: (widthOverride | 0).KeepAtLeast(550), zIndex: hovered_main ? 6 : 5,
									padding: 5, background: backgroundColor.css(), borderRadius: 5, boxShadow: 'rgba(0,0,0,1) 0px 0px 2px',
								}}>
									{(() => {
										const ratings = GetRatings(node._key, holderTypeStr as RatingType);
										return <RatingsPanel node={node} path={path} ratingType={holderTypeStr as RatingType} ratings={ratings}/>;
									})()}
								</div>}
							<NodeUI_Menu_Stub {...{ map, node, path }} holderType={type}/>
						</>}
					/>
					{nodeChildrenToShow != emptyArray && !expanded && nodeChildrenToShow.length != 0 &&
						<NodeChildCountMarker childCount={nodeChildrenToShow.length}/>}
					{/*! nodeView.expanded && (addedDescendants > 0 || editedDescendants > 0) &&
						<NodeChangesMarker {...{addedDescendants, editedDescendants, textOutline, limitBarPos}}/> */}
				</Row>
				{nodeView[expandKey] &&
					<NodeChildHolder ref={(c) => this.childHolder = c}
						{...{ map, node, path, nodeChildrenToShow, type, separateChildren, showArgumentsControlBar }}
						linkSpawnPoint={innerBoxOffset + (height / 2)}
						onHeightOrDividePointChange={this.CheckForChanges}/>}
			</Row>
		);
	}

	get Expanded() {
		const { map, path, type } = this.props;
		const expandKey = `expanded_${HolderType[type].toLowerCase()}`;
		const nodeView = GetNodeView(map._key, path);
		return nodeView[expandKey];
	}

	expandableBox: ExpandableBox;
	ratingPanelHolder: HTMLDivElement;
	ratingPanel: RatingsPanel;
	childHolder: NodeChildHolder;

	ComponentDidMount() {
		$(this.expandableBox.DOM).hover(() => $('.scrolling').length == 0 && this.SetState({ hovered: true }), () => this.SetState({ hovered: false }));
		$(this.expandableBox.expandButton.DOM).hover(() => $('.scrolling').length == 0 && this.SetState({ hovered_button: true }), () => this.SetState({ hovered_button: false }));
	}

	PostRender() {
		this.CheckForChanges();
	}

	lastLineHolderHeight = 0;
	lastHeight = 0;
	lastDividePoint = 0;
	CheckForChanges = () => {
		const { onHeightOrDividePointChange } = this.props;

		const lineHolderHeight = $(this.lineHolder).outerHeight();
		if (lineHolderHeight != this.lastLineHolderHeight) {
			this.SetState({ lineHolderHeight });
		}
		this.lastLineHolderHeight = lineHolderHeight;

		const height = $(GetDOM(this)).outerHeight();
		const dividePoint = this.childHolder && this.Expanded ? this.childHolder.GetDividePoint() : 0;
		if (height != this.lastHeight || dividePoint != this.lastDividePoint) {
			/* if (height != this.lastHeight) {
				this.OnHeightChange();
			} */
			if (dividePoint != this.lastDividePoint) {
				const { height } = this.GetMeasurementInfo();
				const distFromInnerBoxTopToMainBoxCenter = height / 2;
				const innerBoxOffset = (dividePoint - distFromInnerBoxTopToMainBoxCenter).NaNTo(0).KeepAtLeast(0);
				this.SetState({ innerBoxOffset });
			}

			if (onHeightOrDividePointChange) onHeightOrDividePointChange(dividePoint);
		}
		this.lastHeight = height;
		this.lastDividePoint = dividePoint;
	};

	GetMeasurementInfo() {
		// return {width: 90, height: 26};
		return { width: 90, height: 22 };
	}
}
