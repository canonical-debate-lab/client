import { BaseComponentWithConnector } from 'react-vextensions';
import { Connect, YoutubePlayer, YoutubePlayerUI } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { GetSelectedTimeline } from 'Store/main/maps/$map';
import { GetTimelineSteps } from 'Store/firebase/timelines';
import { Column } from 'react-vcomponents';

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
			</Column>
		);
	}
}
