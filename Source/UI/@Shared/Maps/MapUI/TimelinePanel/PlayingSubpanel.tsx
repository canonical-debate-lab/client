import ReactList from 'react-list';
import { Column, Div, Row, Button, DropDown, DropDownTrigger, DropDownContent, Text, Spinner } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM, UseCallback } from 'react-vextensions';
import { ScrollView, ScrollSource } from 'react-vscrollview';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep, GetTimelineSteps } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetSelectedTimeline, GetPlayingTimelineAppliedStepIndex, ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineStepIndex, GetNodeRevealHighlightTime } from 'Store/main/maps/$map';
import { HSLA, UseSize, VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState, YoutubePlayerUI, Icon, GetScreenRect, ActionSet, ACTSet } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import React, { useEffect } from 'react';
import { ToNumber, VRect, Lerp, GetPercentFromXToY, IsNaN, Assert, Timer, WaitXThenRun, Vector2i } from 'js-vextensions';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { StepUI } from './PlayingSubpanel/StepUI';

export class PlayingSubpanel extends BaseComponentPlus({} as {map: Map}, { targetTime: 0, listY: 0, autoScroll: true }, { messageAreaHeight: 0 }) {
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
		const { targetTime, autoScroll } = this.state;
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

					if (autoScroll) {
						// jump one further down, so that the target point *within* the target step is visible (and with enough space for the arrow button itself)
						// this.list.scrollAround(newTargetStepIndex + 1);
						// jump X further down, so that we see some of the upcoming text (also for if video-time data is off some)
						this.list.scrollAround(newTargetStepIndex + 3);
						WaitXThenRun(0, () => this.list.scrollAround(newTargetStepIndex)); // make sure target box itself is still visible, however
					}
				}
			}
		}
	});

	GetTargetInfo = (timeline: Timeline, firstNormalStep: TimelineStep) => {
		const { targetTime, autoScroll } = this.state;
		const { messageAreaHeight } = this.stash;

		let targetStepIndex: number;
		let targetTime_yInMessageArea: number;
		if (timeline) {
			// const steps = timeline ? GetTimelineSteps.Watch(timeline, true) : null;
			const steps = GetTimelineSteps(timeline, true);
			const targetStep = steps.Skip(1).LastOrX(a => a && a.videoTime <= targetTime, firstNormalStep);
			if (targetStep) {
				targetStepIndex = timeline.steps.indexOf(targetStep._key);
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

		const targetTimeDirection = targetTime_yInMessageArea < 0 ? 'up' :
			targetTime_yInMessageArea >= messageAreaHeight - 20 ? 'down' :
				'right';
		/* let distanceOffScreen: number;
		if (targetTimeDirection == 'up') distanceOffScreen = -targetTime_yInMessageArea;
		else if (targetTimeDirection == 'down') distanceOffScreen = targetTime_yInMessageArea - (messageAreaHeight - 20); */

		return { targetStepIndex, targetTime_yInMessageArea, targetTimeDirection };
	};

	// autoScrollDisabling = true;
	// ignoreNextScrollEvent = false;
	OnScroll = (e: React.UIEvent<HTMLDivElement>, source: ScrollSource, pos: Vector2i) => {
		// if (!this.autoScrollDisabling) return;
		/* if (this.ignoreNextScrollEvent) {
			this.ignoreNextScrollEvent = false;
			return;
		} */

		// we only change auto-scroll status if the user initiated the scroll
		if (source == ScrollSource.Code) return;

		const { map } = this.props;
		const timeline = GetSelectedTimeline(map._key);
		const firstNormalStep = GetTimelineStep(timeline ? timeline.steps[1] : null);
		const { targetTimeDirection } = this.GetTargetInfo(timeline, firstNormalStep);
		if (targetTimeDirection != 'right') {
			this.SetState({ autoScroll: false });
		}
	};

	list: ReactList;
	render() {
		const { map } = this.props;
		const { targetTime, autoScroll } = this.state;
		const timeline = GetSelectedTimeline.Watch(map._key);
		// timelineSteps: timeline && GetTimelineSteps(timeline);
		// const targetStepIndex = GetPlayingTimelineAppliedStepIndex.Watch(map._key);

		/* const [ref, { width, height }] = UseSize();
		useEffect(() => ref(this.DOM), [ref]); */
		const [videoRef, { height: videoHeight }] = UseSize();
		const [messageAreaRef, { height: messageAreaHeight }] = UseSize();
		this.Stash({ messageAreaHeight });

		// update some stuff based on timer (since user may have scrolled)
		useEffect(() => {
			this.timer.Start();
			return () => this.timer.Stop();
		}, []);

		const nodeRevealHighlightTime = GetNodeRevealHighlightTime.Watch();

		const firstNormalStep = GetTimelineStep.Watch(timeline ? timeline.steps[1] : null);
		const { targetStepIndex, targetTime_yInMessageArea, targetTimeDirection } = this.GetTargetInfo(timeline, firstNormalStep);

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
				<Row style={{ height: 30, background: 'rgba(0,0,0,.7)' }}>
					<Row ml="auto" style={{ position: 'relative' }}>
						<DropDown>
							<DropDownTrigger><Button text="Options" style={{ height: '100%' }}/></DropDownTrigger>
							<DropDownContent style={{ right: 0, width: 300, zIndex: 11 }}><Column>
								<Row>
									<Text>Node-reveal highlight time:</Text>
									<Spinner ml={5} min={0} value={nodeRevealHighlightTime} onChange={val => store.dispatch(new ACTSet(a => a.main.nodeRevealHighlightTime, val))}/>
								</Row>
							</Column></DropDownContent>
						</DropDown>
					</Row>
				</Row>
				<Row ref={messageAreaRef} style={{ height: `calc(100% - 30px - ${ToNumber(videoHeight, 0)}px)` }}>
					<Column ref={c => this.sideBarEl = c ? c.DOM as any : null} style={{ position: 'relative', width: 20, background: HSLA(0, 0, 0, 1) }}>
						<Button text={<Icon icon={`arrow-${targetTimeDirection}`} size={20}/>} /* enabled={targetTime_yInMessageArea < 0 || targetTime_yInMessageArea >= messageAreaHeight - 20} */
							style={{
								background: 'none', padding: 0,
								position: 'absolute', top: targetTime_yInMessageArea ? targetTime_yInMessageArea.KeepBetween(0, messageAreaHeight - 20) : 0,
								// opacity: autoScroll ? 1 : 0.7,
								filter: autoScroll ? 'sepia(1) saturate(15) hue-rotate(55deg)' : null,
							}}
							onClick={UseCallback(() => {
								if (this.list == null || targetStepIndex == null) return;
								const targetOffScreen = targetTimeDirection != 'right';
								if (targetOffScreen) {
									if (targetTimeDirection == 'down') {
										this.list.scrollAround(targetStepIndex + 1); // jump one further down, so that the target point *within* the target step is visible (and with enough space for the arrow button itself)
									} else {
										this.list.scrollAround(targetStepIndex);
									}
								}

								// const newAutoScroll = targetOffScreen;
								const newAutoScroll = !autoScroll;
								/* this.autoScrollDisabling = false;
								this.SetState({ autoScroll: newAutoScroll }, () => WaitXThenRun(0, () => this.autoScrollDisabling = true)); */
								this.SetState({ autoScroll: newAutoScroll });
							}, [autoScroll, targetStepIndex, targetTimeDirection])}/>
					</Column>
					<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative', padding: 7, filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })} onScroll={this.OnScroll}>
						{/* timelineSteps && timelineSteps.map((step, index) => <StepUI key={index} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} step={step}/>) */}
						<ReactList type='variable' length={timeline.steps.length}
							ref={(c) => {
								this.list = c;
								if (c) this.listRootEl = GetDOM(c) as any;
							}}
							// pageSize={20} threshold={300}
							itemSizeEstimator={(index: number, cache: any) => {
								return 50; // keep at just 50; apparently if set significantly above the actual height of enough items, it causes a gap to sometimes appear at the bottom of the viewport
							}}
							itemRenderer={(index: number, key: any) => {
								if (index == 0) return <div key={key}/>; // atm, hide first step, since just intro message
								const stepID = timeline.steps[index];
								return <StepUI key={stepID} index={index} last={index == timeline.steps.length - 1} map={map} timeline={timeline} stepID={stepID} player={this.player}
									jumpToStep={() => {
										const { player } = this;
										const step = GetTimelineStep(stepID);
										if (player && step.videoTime != null) {
											// this shouldn't be necessary, but apparently is
											(async () => {
												if (player.state == YoutubePlayerState.CUED) {
													player.Play();
													await player.WaitTillState(YoutubePlayerState.PLAYING);
												}
												player.SetPosition(step.videoTime);
												// this.SetState({ targetTime: step.videoTime, autoScroll: true });
												this.SetState({ autoScroll: true });
											})();
										}
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
