import { BaseComponentWithConnector, BaseComponent } from 'react-vextensions';
import { Connect, YoutubePlayer, YoutubePlayerUI, VReactMarkdown_Remarkable } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { GetSelectedTimeline } from 'Store/main/maps/$map';
import { GetTimelineSteps } from 'Store/firebase/timelines';
import { Column, Row, Pre, Div } from 'react-vcomponents';
import { ScrollView } from 'react-vscrollview';
import { ES } from 'Utils/UI/GlobalStyles';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';

const PlayingSubpanel_connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		timeline,
		timelineSteps: timeline && GetTimelineSteps(timeline),
	};
};
@Connect(PlayingSubpanel_connector)
export class PlayingSubpanel extends BaseComponentWithConnector(PlayingSubpanel_connector, {}) {
	render() {
		const { map, timeline, timelineSteps } = this.props;
		if (timeline == null) return null;
		return (
			<Column>
				{timeline.videoID &&
					<YoutubePlayerUI videoID={timeline.videoID} startTime={timeline.videoStartTime} heightVSWidthPercent={timeline.videoHeightVSWidthPercent}
						onPlayerInitialized={player => player.GetPlayerUI().style.position = 'absolute'}/>}
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
					{timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>)}
				</ScrollView>
			</Column>
		);
	}
}

type StepUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, step: TimelineStep} & Partial<{}>;
@Connect((state, { map, step }: StepUIProps) => ({
}))
class StepUI extends BaseComponent<StepUIProps, {}> {
	render() {
		const { index, last, map, timeline, step } = this.props;

		return (
			<Column mt={index == 0 ? 0 : 7} style={{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' }}>
				<Div sel p="7px 10px">
					<Row style={{ float: 'right', fontSize: 16 }}>{index + 1}</Row>
					<VReactMarkdown_Remarkable addMarginsForDanglingNewLines={true}
						className="onlyTopMargin" style={{ marginTop: 5, display: 'flex', flexDirection: 'column', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,1))' }}
						source={step.message} replacements={{}} extraInfo={{}}/>
				</Div>
			</Column>
		);
	}
}
