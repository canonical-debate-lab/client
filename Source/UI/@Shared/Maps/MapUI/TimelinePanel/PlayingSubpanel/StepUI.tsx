import { Column, Div, Row } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState } from 'Utils/FrameworkOverrides';
import {TimelineStep} from 'Store/firebase/timelineSteps/@TimelineStep';
import { PositionOptionsEnum } from '../EditorSubpanel';

export class StepUI extends BaseComponentPlus(
	{} as {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string, player: YoutubePlayer, jumpToStep: (step: TimelineStep)=>any},
) {
	render() {
		const { index, last, map, timeline, stepID, player, jumpToStep } = this.props;
		const step = GetTimelineStep.Watch(stepID);
		if (step == null) return <div style={{ height: 50 }}/>;

		let margin: string;
		if (step.groupID == PositionOptionsEnum.Center) margin = '0 30px';
		if (step.groupID == PositionOptionsEnum.Left) margin = '0 50px 0 0';
		if (step.groupID == PositionOptionsEnum.Right) margin = '0 0 0 50px';

		return (
			// wrapper needed to emulate margin-top (since react-list doesn't support margins)
			<div style={{ paddingTop: index == 0 ? 0 : 7 }}>
				<Column /* mt={index == 0 ? 0 : 7} */ m={margin}
					style={E(
						{ background: 'rgba(0,0,0,.7)', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)' },
						player && step.videoTime != null && { cursor: 'pointer' },
					)}
					// onClick={() => jumpToStep()}
					onClick={async () => {
						if (player && step.videoTime != null) {
							// this shouldn't be necessary, but apparently is
							if (player.state == YoutubePlayerState.CUED) {
								player.Play();
								await player.WaitTillState(YoutubePlayerState.PLAYING);
							}
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
