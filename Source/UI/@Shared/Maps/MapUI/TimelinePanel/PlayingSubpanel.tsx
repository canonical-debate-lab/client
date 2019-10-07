import { BaseComponentWithConnector, BaseComponent } from 'react-vextensions';
import { Connect, YoutubePlayer, YoutubePlayerUI, VReactMarkdown_Remarkable } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { GetSelectedTimeline } from 'Store/main/maps/$map';
import { GetTimelineSteps, GetTimelineStep } from 'Store/firebase/timelines';
import { Column, Row, Pre, Div } from 'react-vcomponents';
import { ScrollView } from 'react-vscrollview';
import { ES } from 'Utils/UI/GlobalStyles';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import ReactList from 'react-list';
import { PositionOptionsEnum } from './EditorSubpanel';

const PlayingSubpanel_connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		timeline,
		// timelineSteps: timeline && GetTimelineSteps(timeline),
	};
};
@Connect(PlayingSubpanel_connector)
export class PlayingSubpanel extends BaseComponentWithConnector(PlayingSubpanel_connector, {}) {
	player: YoutubePlayer;
	render() {
		const { map, timeline } = this.props;
		if (timeline == null) return null;
		return (
			<Column style={{ height: '100%' }}>
				{timeline.videoID &&
				<YoutubePlayerUI videoID={timeline.videoID} startTime={timeline.videoStartTime} heightVSWidthPercent={timeline.videoHeightVSWidthPercent}
					onPlayerInitialized={(player) => {
						this.player = player;
						player.GetPlayerUI().style.position = 'absolute';
						this.Update();
					}}/>}
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
					{/* timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>) */}
					<ReactList type='variable' length={timeline.steps.length}
						// pageSize={20} threshold={300}
						itemSizeEstimator={this.EstimateStepHeight} itemRenderer={this.RenderStep}/>
				</ScrollView>
			</Column>
		);
	}

	EstimateStepHeight = (index: number, cache: any) => {
		return 50; // keep at just 50; apparently if set significantly above the actual height of enough items, it causes a gap to sometimes appear at the bottom of the viewport
	};
	RenderStep = (index: number, key: any) => {
		const { map, timeline } = this.props;
		return <StepUI key={key} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={timeline.steps[index]} player={this.player}/>;
	};
}

type StepUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string, player: YoutubePlayer} & Partial<{step: TimelineStep}> & Partial<{}>;
@Connect((state, { map, stepID }: StepUIProps) => ({
	step: GetTimelineStep(stepID),
}))
class StepUI extends BaseComponent<StepUIProps, {}> {
	render() {
		const { index, last, map, timeline, step, player } = this.props;
		if (step == null) return <div style={{ height: 50 }}/>;

		let margin: string;
		if (step.groupID == PositionOptionsEnum.Center) margin = '0 30px';
		if (step.groupID == PositionOptionsEnum.Left) margin = '0 0 0 50px';
		if (step.groupID == PositionOptionsEnum.Right) margin = '0 50px 0 0';

		return (
			// wrapper needed to emulate margin-top (since react-list doesn't support margins)
			<div style={{ paddingTop: index == 0 ? 0 : 7 }}>
				<Column /* mt={index == 0 ? 0 : 7} */ m={margin}
					style={E(
						{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' },
						player && step.videoTime != null && { cursor: 'pointer' },
					)}
					onClick={() => {
						if (player && step.videoTime != null) {
							player.SetPosition(step.videoTime);
						}
					}}>
					<Div sel p="7px 10px">
						<Row style={{ float: 'right', fontSize: 16 }}>{index + 1}</Row>
						<VReactMarkdown_Remarkable addMarginsForDanglingNewLines={true}
							className="onlyTopMargin" style={{ marginTop: 5, display: 'flex', flexDirection: 'column', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,1))' }}
							source={step.message} replacements={{}} extraInfo={{}}/>
					</Div>
				</Column>
			</div>
		);
	}
}
