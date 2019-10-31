import ReactList from 'react-list';
import { Column, Div, Row } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetSelectedTimeline } from 'Store/main/maps/$map';
import { HSLA, UseSize, VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState, YoutubePlayerUI, Icon } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { useEffect } from 'react';
import { ToNumber } from 'js-vextensions';
import { PositionOptionsEnum } from './EditorSubpanel';

export class PlayingSubpanel extends BaseComponentPlus({} as {map: Map}, {}, {} as { timeline: Timeline }) {
	player: YoutubePlayer;
	render() {
		const { map } = this.props;
		const timeline = GetSelectedTimeline.Watch(map._key);
		// timelineSteps: timeline && GetTimelineSteps(timeline);

		/* const [ref, { width, height }] = UseSize();
		useEffect(() => ref(this.DOM), [ref]); */
		const [videoRef, { height: videoHeight }] = UseSize();

		this.Stash({ timeline });
		if (timeline == null) return null;
		return (
			<Column style={{ height: '100%' }}>
				{timeline.videoID &&
				<YoutubePlayerUI ref={videoRef} videoID={timeline.videoID} startTime={timeline.videoStartTime} heightVSWidthPercent={timeline.videoHeightVSWidthPercent}
					onPlayerInitialized={(player) => {
						this.player = player;
						player.GetPlayerUI().style.position = 'absolute';
						this.Update();
					}}/>}
				{/* <ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
					{/* timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>) *#/}
					<ReactList type='variable' length={timeline.steps.length}
						// pageSize={20} threshold={300}
						itemsRenderer={(items, ref) => {
							return <div ref={ref}>
								<Column style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, background: HSLA(0, 0, 0, 1) }}>
								</Column>
								{items}
							</div>;
						}}
						itemSizeEstimator={this.EstimateStepHeight} itemRenderer={this.RenderStep}/>
				</ScrollView> */}
				<Row style={{ height: `calc(100% - ${ToNumber(videoHeight, 0)}px)` }}>
					<Column style={{ position: 'relative', width: 20, background: HSLA(0, 0, 0, 1) }}>
						<div style={{ position: 'absolute', top: 100 }}>
							<Icon icon="arrow-right" size={20}/>
						</div>
					</Column>
					<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
						{/* timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>) */}
						<ReactList type='variable' length={timeline.steps.length}
							// pageSize={20} threshold={300}
							itemSizeEstimator={this.EstimateStepHeight} itemRenderer={this.RenderStep}/>
					</ScrollView>
				</Row>
			</Column>
		);
	}

	EstimateStepHeight = (index: number, cache: any) => {
		return 50; // keep at just 50; apparently if set significantly above the actual height of enough items, it causes a gap to sometimes appear at the bottom of the viewport
	};
	RenderStep = (index: number, key: any) => {
		const { map, timeline } = this.PropsStash;
		return <StepUI key={key} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={timeline.steps[index]} player={this.player}/>;
	};
}

type StepUIProps = {index: number, last: boolean, map: Map, timeline: Timeline, stepID: string, player: YoutubePlayer};
class StepUI extends BaseComponentPlus({} as StepUIProps, {}) {
	render() {
		const { index, last, map, timeline, stepID, player } = this.props;
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
