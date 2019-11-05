import { Column, Div, Row } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState } from 'Utils/FrameworkOverrides';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { PositionOptionsEnum, NodeRevealUI } from '../EditorSubpanel/StepEditorUI';

export class StepUI extends BaseComponentPlus(
	{} as {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string, player: YoutubePlayer, jumpToStep: (step: TimelineStep)=>any},
	{ showNodeReveals: false },
) {
	render() {
		const { index, last, map, timeline, stepID, player, jumpToStep } = this.props;
		const { showNodeReveals } = this.state;
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
				>
					<Div sel p="7px 10px"
						onClick={() => jumpToStep(step)}
						/* onClick={async () => {
							if (player && step.videoTime != null) {
								// this shouldn't be necessary, but apparently is
								if (player.state == YoutubePlayerState.CUED) {
									player.Play();
									await player.WaitTillState(YoutubePlayerState.PLAYING);
								}
								player.SetPosition(step.videoTime);
							}
						}} */
					>
						<Row style={{ float: 'right', fontSize: 16 }}>{index + 1}</Row>
						<VReactMarkdown_Remarkable addMarginsForDanglingNewLines={true}
							className="onlyTopMargin" style={{ marginTop: 5, display: 'flex', flexDirection: 'column', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,1))' }}
							source={step.message} replacements={{}} extraInfo={{}}/>
					</Div>
					{step.nodeReveals && step.nodeReveals.length > 0 &&
					<Column style={E(
						{ position: 'relative', background: 'rgba(255,255,255,.3)', borderRadius: '0 0 10px 10px' },
					)}>
						<div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center', padding: '3px 5px' }} onClick={() => {
							this.SetState({ showNodeReveals: !showNodeReveals });
						}}>
							Message adds {step.nodeReveals.length} node{step.nodeReveals.length > 1 ? 's' : ''} to the map. (click to {showNodeReveals ? 'hide' : 'view'})
						</div>
						{showNodeReveals && step.nodeReveals &&
						<Column p="0 5px 5px 5px">
							{step.nodeReveals.map((nodeReveal, nodeRevealIndex) => {
								return <NodeRevealUI key={nodeRevealIndex} map={map} step={step} nodeReveal={nodeReveal} editing={false} index={nodeRevealIndex}/>;
							})}
						</Column>}
					</Column>}
				</Column>
			</div>
		);
	}
}
