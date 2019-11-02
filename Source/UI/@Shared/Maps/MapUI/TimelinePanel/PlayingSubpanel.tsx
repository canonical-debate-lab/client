import ReactList from 'react-list';
import { Column, Div, Row } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep, GetTimelineSteps } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetSelectedTimeline, GetPlayingTimelineAppliedStepIndex, ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineStepIndex } from 'Store/main/maps/$map';
import { HSLA, UseSize, VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState, YoutubePlayerUI, Icon, GetScreenRect, ActionSet } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { useEffect } from 'react';
import { ToNumber, VRect, Lerp, GetPercentFromXToY, IsNaN, Assert, Timer } from 'js-vextensions';
import { StepUI } from './PlayingSubpanel/StepUI';

export class PlayingSubpanel extends BaseComponentPlus({} as {map: Map}, { targetTime: 0, listY: 0 }) {
	player: YoutubePlayer;
	listRootEl: HTMLDivElement;
	sideBarEl: HTMLDivElement;
	stepRects = [] as VRect[];

	// temp value for timer to apply
	newTargetTime = 0;
	timer = new Timer(100, () => {
		if (this.listRootEl == null) return;
		this.SetState({ listY: GetScreenRect(this.listRootEl).y, targetTime: this.newTargetTime });
		// Log(`Setting...${GetScreenRect(this.listRootEl).y} @Time:${this.newTargetTime}`);

		const { map } = this.props;
		const { targetTime } = this.state;
		const timeline = GetSelectedTimeline(map._key);
		const targetStepIndex = GetPlayingTimelineStepIndex(map._key);
		// const maxTargetStepIndex = GetPlayingTimelineAppliedStepIndex(map._key);

		const firstStep = GetTimelineStep(timeline ? timeline.steps[0] : null);
		if (timeline) {
			// const steps = timeline ? GetTimelineSteps.Watch(timeline, true) : null;
			const steps = GetTimelineSteps(timeline, true);
			const targetStep = steps.LastOrX(a => a && a.videoTime <= targetTime, firstStep);
			if (targetStep) {
				const newTargetStepIndex = timeline.steps.indexOf(targetStep._key);
				const newMaxTargetStepIndex = newTargetStepIndex.KeepAtLeast(targetStepIndex);
				if (newTargetStepIndex != targetStepIndex) {
					store.dispatch(new ActionSet(
						new ACTMap_PlayingTimelineStepSet({ mapID: map._key, stepIndex: newTargetStepIndex }),
						new ACTMap_PlayingTimelineAppliedStepSet({ mapID: map._key, stepIndex: newMaxTargetStepIndex }),
					));
				}
			}
		}
	});

	render() {
		const { map } = this.props;
		const { targetTime } = this.state;
		const timeline = GetSelectedTimeline.Watch(map._key);
		// timelineSteps: timeline && GetTimelineSteps(timeline);
		// const targetStepIndex = GetPlayingTimelineAppliedStepIndex.Watch(map._key);

		/* const [ref, { width, height }] = UseSize();
		useEffect(() => ref(this.DOM), [ref]); */
		const [videoRef, { height: videoHeight }] = UseSize();

		// update some stuff based on timer (since user may have scrolled)
		useEffect(() => {
			this.timer.Start();
			return () => this.timer.Stop();
		}, []);

		const firstStep = GetTimelineStep.Watch(timeline ? timeline.steps[0] : null);
		let targetTime_yInMessageArea: number;
		if (timeline) {
			// const steps = timeline ? GetTimelineSteps.Watch(timeline, true) : null;
			const steps = GetTimelineSteps(timeline, true);
			const targetStep = steps.LastOrX(a => a && a.videoTime <= targetTime, firstStep);
			if (targetStep) {
				const targetStepIndex = timeline.steps.indexOf(targetStep._key);
				const targetStep_rect = this.stepRects[targetStepIndex];
				const postTargetStepIndex = targetStepIndex + 1 < timeline.steps.length ? targetStepIndex + 1 : -1;
				const postTargetStep = GetTimelineStep(timeline.steps[postTargetStepIndex]);
				if (postTargetStep && targetStep_rect) {
					// const postTargetStep_rect = this.stepRects[postTargetStepIndex];
					/* const targetTime_screenY = Lerp(targetStep_rect.Top, targetStep_rect.Bottom, GetPercentFromXToY(targetStep.videoTime, postTargetStep.videoTime, targetTime));
					targetTime_yInParent = targetTime_screenY - GetScreenRect(this.sideBarEl).y; */
					const percentThroughStep = GetPercentFromXToY(targetStep.videoTime, postTargetStep.videoTime, targetTime);
					const targetTime_yInList = Lerp(targetStep_rect.Top, targetStep_rect.Bottom, percentThroughStep);
					// const listY = GetScreenRect(this.listRootEl).y;
					const { listY } = this.state;
					const messageAreaY = GetScreenRect(this.sideBarEl).y;
					const messageAreaYDiffFromListY = messageAreaY - listY;
					targetTime_yInMessageArea = targetTime_yInList - messageAreaYDiffFromListY;
					Assert(!IsNaN(targetTime_yInMessageArea));
				}
			}
		}

		if (timeline == null) return null;
		return (
			<Column style={{ height: '100%' }}>
				{timeline.videoID &&
				<YoutubePlayerUI ref={videoRef} videoID={timeline.videoID} startTime={timeline.videoStartTime} heightVSWidthPercent={timeline.videoHeightVSWidthPercent}
					onPlayerInitialized={(player) => {
						this.player = player;
						player.GetPlayerUI().style.position = 'absolute';
						this.Update();
					}}
					onPosChanged={(pos) => {
						// this.SetState({ targetTime: pos });
						// just set state directly, because the timer above will handle the refreshing
						// this.state['targetTime'] = pos;
						this.newTargetTime = pos;
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
					<Column ref={c => this.sideBarEl = c ? c.DOM as any : null} style={{ position: 'relative', width: 20, background: HSLA(0, 0, 0, 1) }}>
						<div style={{ position: 'absolute', top: targetTime_yInMessageArea }}>
							<Icon icon="arrow-right" size={20}/>
						</div>
					</Column>
					<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
						{/* timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>) */}
						<ReactList ref={c => c && (this.listRootEl = GetDOM(c) as any)} type='variable' length={timeline.steps.length}
							// pageSize={20} threshold={300}
							itemSizeEstimator={(index: number, cache: any) => {
								return 50; // keep at just 50; apparently if set significantly above the actual height of enough items, it causes a gap to sometimes appear at the bottom of the viewport
							}}
							itemRenderer={(index: number, key: any) => {
								if (index == 0) return <div key={key}/>; // atm, hide first step, since just intro message
								const stepID = timeline.steps[index];
								return <StepUI key={key} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={stepID} player={this.player}
									jumpToStep={() => {
										/* const { player } = this;
										const step = GetTimelineStep(stepID);
										if (player && step.videoTime != null) {
											// this shouldn't be necessary, but apparently is
											(async () => {
												if (player.state == YoutubePlayerState.CUED) {
													player.Play();
													await player.WaitTillState(YoutubePlayerState.PLAYING);
												}
												player.SetPosition(step.videoTime);
												this.SetState({ targetTime: step.videoTime });
											})();
										} */
									}}
									ref={(c) => {
										if (!c || c.DOM_HTML == null) return;
										const listRoot = c.DOM_HTML.parentElement.parentElement.parentElement;
										const listRect = GetScreenRect(listRoot);

										const el = c.DOM_HTML;
										const rect = GetScreenRect(el);
										rect.Position = rect.Position.Minus(listRect.Position);
										// this.SetState({ [`step${index}_rect`]: rect }, null, null, true);
										this.stepRects[index] = rect;
									}}/>;
							}}/>
					</ScrollView>
				</Row>
			</Column>
		);
	}
}
