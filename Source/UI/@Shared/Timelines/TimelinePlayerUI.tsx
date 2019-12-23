import { Button, Column, Pre, Row, Span } from 'react-vcomponents';
import { BaseComponent, FindReact, BaseComponentPlus } from 'react-vextensions';
import { Map } from 'Store/firebase/maps/@Map';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetEntries } from 'js-vextensions';
import { VReactMarkdown_Remarkable } from 'vwebapp-framework';
import { store } from 'Store';
import { GetPlayingTimelineAppliedStepIndex, GetPlayingTimelineStep, GetPlayingTimeline, GetPlayingTimelineStepIndex } from 'Store/main/mapStates/$mapState';
import { Segment } from '../../../Utils/General/RegexHelpers';
import { AsNodeL3 } from '../../../Store/firebase/nodes/$node';
import { MapNodeL3, Polarity } from '../../../Store/firebase/nodes/@MapNode';
import { TimelineStep } from '../../../Store/firebase/timelineSteps/@TimelineStep';
import { NodeUI_Inner } from '../Maps/MapNode/NodeUI_Inner';

function GetPropsFromPropsStr(propsStr: string) {
	const propStrMatches = propsStr.Matches(/ (.+?)="(.+?)"/g);
	const props = {} as any;
	for (const propStrMatch of propStrMatches) {
		props[propStrMatch[1]] = propStrMatch[2];
	}
	return props;
}

const replacements = {
	'\\[comment(.*?)\\]((.|\n)*?)\\[\\/comment\\]': (segment: Segment, index: number) => {
		const props = GetPropsFromPropsStr(segment.textParts[1]);
		const text = segment.textParts[2];

		return (
			<a href={props.link} target="_blank">
				<Column style={{ background: 'rgb(247,247,247)', color: 'rgb(51, 51, 51)', borderRadius: 5, padding: 5 }}>
					<Row>
						<span style={{ fontWeight: 'bold' }}>{props.author}</span>
						<Span ml="auto" style={{ color: 'rgb(153,153,153)', fontSize: 12 }}>{props.date}</Span>
					</Row>
					<VReactMarkdown_Remarkable source={text}/>
				</Column>
			</a>
		);
	},
	'\\[node(.*?)\\/\\]': (segment: Segment, index: number, extraInfo) => {
		const props = GetPropsFromPropsStr(segment.textParts[1]);
		const polarityEntry = props.polarity ? GetEntries(Polarity).find((a) => a.name.toLowerCase() == props.polarity) : null;
		const polarity = polarityEntry ? polarityEntry.value : Polarity.Supporting;
		return (
			<NodeUI_InMessage map={extraInfo.map} nodeID={props.id} polarity={polarity} index={index}/>
		);
	},
	'\\[connectNodesButton(.*?)\\/\\]': (segment: Segment, index: number, extraInfo) => {
		const props = GetPropsFromPropsStr(segment.textParts[1]);
		// let ids = (props.ids || "").replace(/ /g, "").split(",").map(ToInt);
		const currentStep = extraInfo.currentStep as TimelineStep;
		// let ids = currentStep.actions.filter(a=>a.type == TimelineStepActionType.ShowNode).map(a=>a.showNode_nodeID);
		// let ids = (currentStep.nodeReveals || []).map(a=>a.nodeID);
		const mapInfo = store.main.mapStates.get(extraInfo.map._key);
		return (
			<Button text={props.text || 'Place into debate map'} enabled={!extraInfo.stepApplied}
				style={{ alignSelf: 'center', fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}
				onClick={(e) => {
					// let currentStep = await GetAsync(()=>GetPlayingTimelineStepIndex(extraInfo.map._id));
					mapInfo.playingTimeline_appliedStep = extraInfo.currentStepIndex;
				}}/>
		);
	},
	'\\[text(.*?)\\]((.|\n)*?)\\[\\/text\\]': (segment: Segment, index: number, extraInfo) => {
		const props = GetPropsFromPropsStr(segment.textParts[1]);
		return (
			<span style={E(props.textSize && { fontSize: props.textSize })}>
				<VReactMarkdown_Remarkable source={segment.textParts[2]}/>
			</span>
		);
	},
};

type NodeUI_InMessageProps = {map: Map, nodeID: string, polarity: Polarity, index: number};
class NodeUI_InMessage extends BaseComponentPlus({} as NodeUI_InMessageProps, {}) {
	render() {
		const { map, nodeID, polarity, index } = this.props;
		const node = GetNodeL2(nodeID) ? AsNodeL3(GetNodeL2(nodeID), polarity, null) : null;
		if (!node) return <div/>;

		const path = `${nodeID}`;
		return (
			<NodeUI_Inner indexInNodeList={0} map={map} node={node} path={path} width={null} widthOverride={null}
				panelPosition="below" useLocalPanelState={true}
				style={{
					// zIndex: 1, filter: "drop-shadow(0px 0px 10px rgba(0,0,0,1))"
					// zIndex: 100 - index,
				}}/>
		);
	}
}

export class TimelinePlayerUI extends BaseComponentPlus({} as {map: Map}, {}) {
	root: Column;
	render() {
		const { map } = this.props;
		const playingTimeline = GetPlayingTimeline(map._key);
		const currentStep = GetPlayingTimelineStep(map._key);
		const appliedStepIndex = GetPlayingTimelineAppliedStepIndex(map._key);

		if (!playingTimeline) return <div/>;
		if (!currentStep) return <div/>;

		const currentStepIndex = playingTimeline.steps.indexOf(currentStep._key);

		const stepApplied = appliedStepIndex >= currentStepIndex || (currentStep.nodeReveals || []).length == 0;

		const mapInfo = store.main.mapStates.get(map._key);
		return (
			<Column ref={(c) => this.root = c}
				style={{ position: 'absolute', zIndex: 2, left: 10, top: 40, width: 500, padding: 10, background: 'rgba(0,0,0,.7)', borderRadius: 5 }}
				onClick={(e) => {
					if ((e.target as HTMLElement).GetSelfAndParents().Any((a) => a.classList && a.classList.contains('NodeUI_Inner'))) return;
					for (const nodeUI of this.root.DOM.$('.NodeUI_Inner').map((a) => FindReact(a) as NodeUI_Inner)) {
						nodeUI.SetState({ local_openPanel: null });
					}
				}}>
				<Row style={{ position: 'relative' }}>
					<Pre style={{ fontSize: 18, textAlign: 'center', width: '100%' }}>Timeline</Pre>
					<Button text="X" style={{ position: 'absolute', right: 0, padding: '3px 6px', marginTop: -2, marginRight: -2, fontSize: 13 }} onClick={() => {
						// mapInfo.playingTimeline = null;
						mapInfo.playingTimeline_step = null;
						mapInfo.playingTimeline_appliedStep = null;
					}}/>
				</Row>
				<Row mt={5} style={{ position: 'relative' }}>
					<Button text="<" enabled={currentStepIndex > 0} onClick={() => {
						mapInfo.playingTimeline_step = currentStepIndex - 1;
					}}/>
					{stepApplied && currentStepIndex == 0 && appliedStepIndex >= 0
						&& <Button ml={5} text="Restart" onClick={() => {
							mapInfo.playingTimeline_appliedStep = null;
						}}/>}
					<Pre className="clickThrough" style={{ position: 'absolute', fontSize: 15, textAlign: 'center', width: '100%' }}>
						Step {currentStepIndex + 1}{currentStep.title ? `: ${currentStep.title}` : ''}
					</Pre>
					{/* <Button ml={5} text="="/> */}
					{/* <Button ml="auto" text="Connect" enabled={} onClick={()=> {
					}}/> */}
					{stepApplied
						&& <Button ml="auto" text=">" enabled={playingTimeline.steps && currentStepIndex < playingTimeline.steps.length - 1} onClick={() => {
							mapInfo.playingTimeline_step = currentStepIndex + 1;
						}}/>}
					{!stepApplied
						&& <Button ml="auto" text="Place" onClick={() => {
							mapInfo.playingTimeline_appliedStep = currentStepIndex;
						}}/>}
				</Row>
				<Row sel>
					<VReactMarkdown_Remarkable addMarginsForDanglingNewLines={true}
						className="onlyTopMargin" style={{ marginTop: 5, display: 'flex', flexDirection: 'column', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,1))' }}
						source={currentStep.message || ''} replacements={replacements} extraInfo={{ map, currentStepIndex, currentStep, stepApplied }}/>
				</Row>
				{/* <ScrollView style={{maxHeight: 300}}>
				</ScrollView> */}
			</Column>
		);
	}
}

export class TimelineOverlayUI extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const { map } = this.props;
		const playingTimeline = GetPlayingTimeline(map._key);
		const currentStepIndex = GetPlayingTimelineStepIndex(map._key);
		if (!playingTimeline) return <div/>;
		return (
			<Column style={{ position: 'absolute', zIndex: 1, left: 0, right: 0, top: 30, bottom: 0 }}>
				Step: {currentStepIndex}
			</Column>
		);
	}
}
