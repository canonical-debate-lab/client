import ReactList from 'react-list';
import { Column, Div, Row, Button, DropDown, DropDownTrigger, DropDownContent, Text, Spinner } from 'react-vcomponents';
import { BaseComponentPlus, GetDOM, UseCallback, UseState } from 'react-vextensions';
import { ScrollView, ScrollSource } from 'react-vscrollview';
import { Map } from 'Store/firebase/maps/@Map';
import { GetTimelineStep, GetTimelineSteps } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetSelectedTimeline, GetPlayingTimelineAppliedStepIndex, ACTMap_PlayingTimelineAppliedStepSet, ACTMap_PlayingTimelineStepSet, GetPlayingTimelineStepIndex, GetNodeRevealHighlightTime } from 'Store/main/maps/$map';
import { HSLA, UseSize, VReactMarkdown_Remarkable, YoutubePlayer, YoutubePlayerState, YoutubePlayerUI, Icon, GetScreenRect, ActionSet, ACTSet, RunWithRenderingBatched } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import React, { useEffect } from 'react';
import { ToNumber, VRect, Lerp, GetPercentFromXToY, IsNaN, Assert, Timer, WaitXThenRun, Vector2i } from 'js-vextensions';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import _ from 'lodash';
import { GetPlayingTimelineTime, ACTSetPlayingTimelineTime } from 'StoreM/main/maps/$map';
import { storeM } from 'StoreM/StoreM';
import { StepUI } from './PlayingSubpanel/StepUI';

export class PlayingSubpanel extends BaseComponentPlus(
	{} as {map: Map},
	{
		targetTime: null as number, autoScroll: true,
		/* targetStepIndex: null as number, */ targetTime_yInMessageArea: null as number, targetTimeDirection: 'down' as 'down' | 'up' | 'right',
	},
	{ messageAreaHeight: 0 },
) {
	player: YoutubePlayer;
	listRootEl: HTMLDivElement;
	sideBarEl: HTMLDivElement;
	// stepRects = [] as VRect[];
	// stepComps = [] as StepUI[];
	stepElements = [] as HTMLDivElement[];
	stepElements_updateTimes = {};

	// there are three "target time" fields: reduxState.main.maps.$mapID.playingTimeline_time, this.state.targetTime, this.newTargetTime
	// #1 is for persistence between sessions and sharing with node-uis (updates once per second), #2 is for this comp's arrow (frequent updates), #3 is just a helper for updating #1 and #2

	lastListY = -1;

	// temp value for timer to apply
	newTargetTime: number;
	timer = new Timer(100, () => RunWithRenderingBatched.Go = () => {
		const { map } = this.props;
		let { targetTime, autoScroll } = this.state;
		const oldTargetTime = targetTime;

		// Log('Checking');
		const targetTime_fromRedux = GetPlayingTimelineTime(map._key); // from redux store
		if (this.newTargetTime != null) {
			// Log('Applying this.newTargetTime:', this.newTargetTime, '@targetTime_fromRedux:', targetTime_fromRedux);
			this.SetState({ targetTime: this.newTargetTime });
			targetTime = this.newTargetTime; // maybe temp
			const newTargetTime_floored = this.newTargetTime.FloorTo(1);
			if (newTargetTime_floored != targetTime_fromRedux) {
				// store.dispatch(new ACTMap_PlayingTimelineTimeSet({ mapID: map._key, time: newTargetTime_floored }));
				// storeM.main.maps.get(map._key).playingTimeline_time = newTargetTime_floored;
				ACTSetPlayingTimelineTime(map._key, newTargetTime_floored);
			}
		}

		/* if (this.listRootEl != null) {
			// this.SetState({ listY: GetScreenRect(this.listRootEl).y });
			// Log(`Setting...${GetScreenRect(this.listRootEl).y}`);
			const listY = GetScreenRect(this.listRootEl).y;
			if (listY != this.lastListY) {
				this.UpdateTargetInfo();
				this.lastListY = listY;
			}
		} */

		const listY = this.listRootEl ? GetScreenRect(this.listRootEl).y : null;
		if (targetTime != oldTargetTime || listY != this.lastListY) {
			this.UpdateTargetInfo();
			this.lastListY = listY;
		}

		const timeline = GetSelectedTimeline(map._key);
		const targetStepIndex = GetPlayingTimelineStepIndex(map._key);
		// const maxTargetStepIndex = GetPlayingTimelineAppliedStepIndex(map._key);
		const firstStep = GetTimelineStep(timeline ? timeline.steps[0] : null);
		if (timeline && targetTime != null) {
			// const steps = timeline ? GetTimelineSteps.Watch(timeline, true) : null;
			const steps = GetTimelineSteps(timeline, true);
			const targetStep = steps.LastOrX(a => a && a.videoTime <= targetTime, firstStep);
			if (targetStep) {
				const newTargetStepIndex = timeline.steps.indexOf(targetStep._key);
				const newMaxTargetStepIndex = newTargetStepIndex.KeepAtLeast(targetStepIndex);
				if (newTargetStepIndex != targetStepIndex) {
					Log('Target-step changing @Old:', targetStepIndex, '@New:', newTargetStepIndex, '@Time:', targetTime);
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
				const postTargetStepIndex = targetStepIndex + 1 < timeline.steps.length ? targetStepIndex + 1 : -1;
				const postTargetStep = GetTimelineStep(timeline.steps[postTargetStepIndex]);

				// const targetStep_rect = this.stepRects[targetStepIndex];
				/* const targetStep_comp = this.stepComps[targetStepIndex];
				if (postTargetStep && targetStep_comp) {
					const listRoot = targetStep_comp.DOM_HTML.parentElement.parentElement.parentElement; */
				const targetStep_el = this.stepElements[targetStepIndex];
				if (postTargetStep && targetStep_el && document.body.contains(targetStep_el)) {
					const listRoot = targetStep_el.parentElement.parentElement.parentElement;
					const listRect = GetScreenRect(listRoot);
					const targetStep_rect = GetScreenRect(targetStep_el);
					targetStep_rect.Position = targetStep_rect.Position.Minus(listRect.Position);
					// Log('Target step rect:', targetStep_rect);

					// const postTargetStep_rect = this.stepRects[postTargetStepIndex];
					/* const targetTime_screenY = Lerp(targetStep_rect.Top, targetStep_rect.Bottom, GetPercentFromXToY(targetStep.videoTime, postTargetStep.videoTime, targetTime));
					targetTime_yInParent = targetTime_screenY - GetScreenRect(this.sideBarEl).y; */
					const percentThroughStep = GetPercentFromXToY(targetStep.videoTime, postTargetStep.videoTime, targetTime);
					const targetTime_yInList = Lerp(targetStep_rect.Top, targetStep_rect.Bottom, percentThroughStep);
					const listY = GetScreenRect(this.listRootEl).y;
					// const { listY } = this.state;
					const messageAreaY = GetScreenRect(this.sideBarEl).y;
					const messageAreaYDiffFromListY = messageAreaY - listY;
					targetTime_yInMessageArea = targetTime_yInList - messageAreaYDiffFromListY;
					Assert(!IsNaN(targetTime_yInMessageArea));
				}
			}
		}

		let targetTimeDirection;
		if (targetTime_yInMessageArea != null) {
			if (targetTime_yInMessageArea < 0) targetTimeDirection = 'up';
			else if (targetTime_yInMessageArea >= messageAreaHeight - 20) targetTimeDirection = 'down';
			else targetTimeDirection = 'right';
		} else if (this.list) {
			const [firstVisibleIndex, lastVisibleIndex] = this.list.getVisibleRange();
			targetTimeDirection = targetStepIndex <= firstVisibleIndex ? 'up' : 'down';
			targetTime_yInMessageArea = targetTimeDirection == 'up' ? 0 : messageAreaHeight - 20;
		}

		/* let distanceOffScreen: number;
		if (targetTimeDirection == 'up') distanceOffScreen = -targetTime_yInMessageArea;
		else if (targetTimeDirection == 'down') distanceOffScreen = targetTime_yInMessageArea - (messageAreaHeight - 20); */

		this.Stash({ targetTime_yInMessageArea, targetTimeDirection } as any); // for debugging
		return { targetTime_yInMessageArea, targetTimeDirection };
	};
	UpdateTargetInfo = () => {
		const { map } = this.props;
		const timeline = GetSelectedTimeline(map._key);
		const firstNormalStep = GetTimelineStep(timeline ? timeline.steps[1] : null);
		const { targetTime_yInMessageArea, targetTimeDirection } = this.GetTargetInfo(timeline, firstNormalStep);
		this.SetState({ targetTime_yInMessageArea, targetTimeDirection });
		/* this.SetState(E(
			{ targetStepIndex },
			// only update targetTime_yInMessageArea (and derivative direction) if we were able to obtain its new value (ie. if box still visible)
			targetTime_yInMessageArea != null && {
				targetTime_yInMessageArea,
				targetTimeDirection: targetTimeDirection as any,
			},
		)); */
	}
	// UpdateTargetInfo_Throttled = _.throttle(this.UpdateTargetInfo, 100);

	/* PostSelfOrTargetStepRender() {
		this.UpdateTargetInfo();
	}
	PostRender() {
		this.PostSelfOrTargetStepRender();
	} */
	/* PostRender() {
		this.UpdateTargetInfo();
	} */

	/* ComponentDidMount() {
		const { map } = this.props;
		const { targetTime, autoScroll } = this.state;
		const targetTime_fromRedux = GetPlayingTimelineTime(map._key); // from redux store

		// on component mount, load timeline-time from redux-store
		if (this.newTargetTime == null && targetTime == null) {
			this.newTargetTime = targetTime_fromRedux;
			if (autoScroll) {
				new Timer()
				// jump one further down, so that the target point *within* the target step is visible (and with enough space for the arrow button itself)
				// this.list.scrollAround(newTargetStepIndex + 1);
				// jump X further down, so that we see some of the upcoming text (also for if video-time data is off some)
				this.list.scrollAround(targetStepIndex + 3);
				WaitXThenRun(0, () => this.list.scrollAround(targetStepIndex)); // make sure target box itself is still visible, however
			}
		}
	} */

	ComponentDidMount() {
		const { map } = this.props;

		// on component mount, load timeline-time from redux-store
		const targetTime_fromRedux = GetPlayingTimelineTime(map._key);
		// this.SetState({ targetTime: targetTime_fromRedux });
		this.newTargetTime = targetTime_fromRedux; // actually gets applied to state by timer
	}

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

		// this processing is here rather than in timer, because only this OnScroll function is told whether the scroll was user-initiated
		const { map } = this.props;
		const timeline = GetSelectedTimeline(map._key);
		const firstNormalStep = GetTimelineStep(timeline ? timeline.steps[1] : null);
		// const { targetTimeDirection } = this.GetTargetInfo(timeline, firstNormalStep);
		const { targetTimeDirection } = this.state;
		if (targetTimeDirection != 'right') {
			this.SetState({ autoScroll: false });
		}

		// this.UpdateTargetInfo_Throttled();
	};

	list: ReactList;
	render() {
		const { map } = this.props;
		const { targetTime, autoScroll, targetTime_yInMessageArea, targetTimeDirection } = this.state;
		const timeline = GetSelectedTimeline.Watch(map._key);
		// timelineSteps: timeline && GetTimelineSteps(timeline);
		const targetStepIndex = GetPlayingTimelineAppliedStepIndex.Watch(map._key);

		/* const [ref, { width, height }] = UseSize();
		useEffect(() => ref(this.DOM), [ref]); */
		const [videoRef, { height: videoHeight }] = UseSize();
		const [messageAreaRef, { height: messageAreaHeight }] = UseSize();
		this.Stash({ messageAreaHeight });

		const targetTime_floored = GetPlayingTimelineTime(map._key); // no need to watch, since only used as start-pos for video, if in initial mount
		const nodeRevealHighlightTime = GetNodeRevealHighlightTime.Watch();
		const firstNormalStep = GetTimelineStep.Watch(timeline ? timeline.steps[1] : null); // just watch for PostRender->UpdateTargetInfo code

		/* (useEffect as any)(() => {
			const targetTime_fromRedux = GetPlayingTimelineTime(map._key); // from redux store
			let loadScrollTimer: Timer;

			// on component mount, load timeline-time from redux-store
			if (this.newTargetTime == null && targetTime == null) {
				this.newTargetTime = targetTime_fromRedux;
				if (autoScroll) {
					loadScrollTimer = new Timer(500, () => {
						const [firstVisibleIndex, lastVisibleIndex] = this.list.getVisibleRange();
						this.list.
						if (lastVisibleIndex < targetStepIndex + 3) {
							// todo
						} else {
							// jump one further down, so that the target point *within* the target step is visible (and with enough space for the arrow button itself)
							// this.list.scrollAround(newTargetStepIndex + 1);
							// jump X further down, so that we see some of the upcoming text (also for if video-time data is off some)
							this.list.scrollAround(targetStepIndex + 3);
							WaitXThenRun(0, () => this.list.scrollAround(targetStepIndex)); // make sure target box itself is still visible, however
						}
					}).Start();
				}
			}
			return () => {
				if (loadScrollTimer) loadScrollTimer.Stop();
			};
		}, []); */

		// update some stuff based on timer (since user may have scrolled)
		useEffect(() => {
			this.timer.Start();
			return () => this.timer.Stop();
		}, []);

		// todo: make-so the UseCallbacks below can't break from this early-return changing the hook-count (atm, not triggering since timeline is always ready when this comp renders)
		if (timeline == null) return null;
		return (
			<Column style={{ height: '100%' }}>
				{timeline.videoID &&
				<YoutubePlayerUI ref={videoRef} videoID={timeline.videoID} startTime={targetTime_floored || timeline.videoStartTime} heightVSWidthPercent={timeline.videoHeightVSWidthPercent}
					onPlayerInitialized={(player) => {
						this.player = player;
						player.GetPlayerUI().style.position = 'absolute';
						this.Update();
					}}
					onPosChanged={(pos) => {
						if (pos == 0) return; // ignore "pos 0" event; this just happens when the video first loads (even if seek-to time set otherwise)
						// this.SetState({ targetTime: pos });
						// just set state directly, because the timer above will handle the refreshing
						// this.state['targetTime'] = pos;
						// if (pos == timeline.videoStartTime && this.newTargetTime == null) return; // don't set newTargetTime
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
							ref={UseCallback((c) => {
								this.list = c;
								// Log('Test1', c);
								if (c) {
									this.listRootEl = GetDOM(c) as any;
									// this.UpdateTargetInfo();
									// requestAnimationFrame(() => this.UpdateTargetInfo());
								}
							}, [])}
							initialIndex={targetStepIndex}
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
										if (c == null || c.DOM_HTML == null) return;
										/* const listRoot = c.DOM_HTML.parentElement.parentElement.parentElement;
										const listRect = GetScreenRect(listRoot);

										const el = c.DOM_HTML;
										const rect = GetScreenRect(el);
										rect.Position = rect.Position.Minus(listRect.Position);
										// this.SetState({ [`step${index}_rect`]: rect }, null, null, true);
										this.stepRects[index] = rect; */
										// this.stepComps[index] = c;
										this.stepElements[index] = c.DOM_HTML as any;
										this.stepElements_updateTimes[index] = Date.now();

										// if within a second of the target-step having rendered, check if its rect needs updating
										/* if (index == targetStepIndex || Date.now() - ToNumber(this.stepElements_updateTimes[targetStepIndex], 0) < 1000) {
											this.PostSelfOrTargetStepRender();
											WaitXThenRun(10, () => this.PostSelfOrTargetStepRender());
											requestAnimationFrame(() => this.PostSelfOrTargetStepRender());
										} */

										/* if (index == targetStepIndex) {
											this.PostSelfOrTargetStepRender();
											WaitXThenRun(500, () => this.PostSelfOrTargetStepRender());
										} */

										// for the next X seconds, check if we are the target-step; if so, check if our rect needs updating (no need to do this if video playing though, as that triggers UpdateTargetInfo on its own)
										// if (this.player.state == YoutubePlayerState.CUED) {
										if (this.player && this.player.state != YoutubePlayerState.PLAYING) {
											new Timer(200, () => {
												if (!document.body.contains(c.DOM_HTML)) return;
												if (index == targetStepIndex) {
													// this.PostSelfOrTargetStepRender();
													this.UpdateTargetInfo();
												}
											}, 5).Start();
										}
									}}/>;
							}}/>
					</ScrollView>
				</Row>
			</Column>
		);
	}
}
