import { emptyArray, FromJSON, GetValues, ToNumber } from 'js-vextensions';
import { GetMap } from 'Store/firebase/maps';
import { GetNode, GetNodeChildren } from 'Store/firebase/nodes';
import { GetTimeline, GetTimelineStep } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { O } from 'vwebapp-framework';
import { StoreAccessor } from 'mobx-firelink';

export enum SortType {
	CreatorID = 10,
	CreationDate = 20,
	// UpdateDate = 30,
	// ViewerCount = 40,
}
export enum TimelineSubpanel {
	Collection,
	Editor,
	Playing,
}

export enum ShowChangesSinceType {
	None = 10,
	SinceVisitX = 20,
	AllUnseenChanges = 30,
}

export class MapState {
	list_sortBy = SortType.CreationDate;
	list_filter = '';
	list_page = 0;

	list_selectedNodeID = null as string;
	list_selectedNode_openPanel = null as string;

	timelinePanelOpen = false;
	timelineOpenSubpanel = TimelineSubpanel.Collection;
	showTimelineDetails = false;
	selectedTimeline = null as string;

	showChangesSince_type = ShowChangesSinceType.SinceVisitX;
	showChangesSince_visitOffset = 1;

	@O playingTimeline_time: number;
	@O playingTimeline_step: number; // step currently scrolled to
	@O playingTimeline_appliedStep: number; // max step scrolled to
}

export const GetSelectedNodeID_InList = StoreAccessor((s) => (mapID: string) => {
	return s.main.maps.get(mapID).list_selectedNodeID;
});
export const GetSelectedNode_InList = StoreAccessor((s) => (mapID: string) => {
	const nodeID = GetSelectedNodeID_InList(mapID);
	return GetNode(nodeID);
});

export const GetMap_List_SelectedNode_OpenPanel = StoreAccessor((s) => (mapID: string) => {
	return s.main.maps.get(mapID).list_selectedNode_openPanel;
});

export const GetTimelinePanelOpen = StoreAccessor((s) => (mapID: string): boolean => {
	if (mapID == null) return false;
	return s.main.maps.get(mapID).timelinePanelOpen;
});
export const GetTimelineOpenSubpanel = StoreAccessor((s) => (mapID: string) => {
	if (mapID == null) return null;
	return s.main.maps.get(mapID).timelineOpenSubpanel;
});
export const GetShowTimelineDetails = StoreAccessor((s) => (mapID: string): boolean => {
	if (mapID == null) return null;
	return s.main.maps.get(mapID).showTimelineDetails;
});
export const GetSelectedTimeline = StoreAccessor((s) => (mapID: string): Timeline => {
	if (mapID == null) return null;
	const timelineID = s.main.maps.get(mapID).selectedTimeline;
	return GetTimeline(timelineID);
});
export const GetPlayingTimeline = StoreAccessor((s) => (mapID: string): Timeline => {
	if (mapID == null) return null;
	/* const mapInfo = State('main', 'maps', mapID) as MapInfo;
	// const timelineID = State('main', 'maps', mapID, 'playingTimeline');
	if (mapInfo == null || !mapInfo.timelinePanelOpen || mapInfo.timelineOpenSubpanel != TimelineSubpanel.Playing) return null;
	const timelineID = mapInfo.selectedTimeline;
	return GetTimeline(timelineID); */
	if (!s.main.maps.get(mapID).timelinePanelOpen || s.main.maps.get(mapID).timelineOpenSubpanel != TimelineSubpanel.Playing) return null;
	const timelineID = s.main.maps.get(mapID).selectedTimeline;
	return GetTimeline(timelineID);
});
/* export const GetPlayingTimelineTime = StoreAccessor((mapID: string): number => {
	if (mapID == null) return null;
	return State('main', 'maps', mapID, 'playingTimeline_time');
}); */
export const GetPlayingTimelineStepIndex = StoreAccessor((s) => (mapID: string): number => {
	if (mapID == null) return null;
	return s.main.maps.get(mapID).playingTimeline_step;
});
export const GetPlayingTimelineStep = StoreAccessor((s) => (mapID: string) => {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return null;
	const stepIndex = GetPlayingTimelineStepIndex(mapID) || 0;
	const stepID = playingTimeline.steps[stepIndex];
	return GetTimelineStep(stepID);
});
export const GetPlayingTimelineCurrentStepRevealNodes = StoreAccessor((s) => (mapID: string): string[] => {
	const playingTimeline_currentStep = GetPlayingTimelineStep(mapID);
	if (playingTimeline_currentStep == null) return emptyArray;
	return GetNodesRevealedInSteps([playingTimeline_currentStep]);
});

export const GetPlayingTimelineRevealNodes_All = StoreAccessor((s) => (mapID: string): string[] => {
	const map = GetMap(mapID);
	if (!map) return emptyArray;

	const steps = GetPlayingTimelineSteps(mapID);
	return [`${map.rootNode}`].concat(GetNodesRevealedInSteps(steps));
});

export const GetPlayingTimelineAppliedStepIndex = StoreAccessor((s) => (mapID: string): number => {
	if (mapID == null) return null;
	return s.main.maps.get(mapID).playingTimeline_appliedStep;
});
export const GetPlayingTimelineAppliedSteps = StoreAccessor((s) => (mapID: string, excludeAfterCurrentStep = false): TimelineStep[] => {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return emptyArray;
	let stepIndex = GetPlayingTimelineAppliedStepIndex(mapID) || -1;
	if (excludeAfterCurrentStep) {
		const currentStep = GetPlayingTimelineStepIndex(mapID);
		stepIndex = Math.min(currentStep, stepIndex);
	}
	const stepIDs = playingTimeline.steps.slice(0, stepIndex + 1);
	const steps = stepIDs.map((a) => GetTimelineStep(a));
	if (steps.Any((a) => a == null)) return emptyArray;
	return steps;
});
export const GetPlayingTimelineRevealNodes_UpToAppliedStep = StoreAccessor((s) => (mapID: string, excludeAfterCurrentStep = false): string[] => {
	const map = GetMap(mapID);
	if (!map) return emptyArray;

	const appliedSteps = GetPlayingTimelineAppliedSteps(mapID, excludeAfterCurrentStep);
	return [`${map.rootNode}`].concat(GetNodesRevealedInSteps(appliedSteps));
});

export const GetPlayingTimelineSteps = StoreAccessor((s) => (mapID: string): TimelineStep[] => {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return emptyArray;
	const steps = playingTimeline.steps.map((a) => GetTimelineStep(a));
	if (steps.Any((a) => a == null)) return emptyArray;
	return steps;
});
export const GetNodeRevealTimesInSteps = StoreAccessor((s) => (steps: TimelineStep[], baseOnLastReveal = false) => {
	const nodeRevealTimes = {} as {[key: string]: number};
	for (const [index, step] of steps.entries()) {
		for (const reveal of step.nodeReveals || []) {
			const stepTime_safe = step.videoTime != null ? step.videoTime : steps.slice(0, index).map((a) => a.videoTime).LastOrX((a) => a != null);
			if (baseOnLastReveal) {
				nodeRevealTimes[reveal.path] = Math.max(stepTime_safe, ToNumber(nodeRevealTimes[reveal.path], 0));
			} else {
				nodeRevealTimes[reveal.path] = Math.min(stepTime_safe, ToNumber(nodeRevealTimes[reveal.path], Number.MAX_SAFE_INTEGER));
			}

			if (reveal.revealDepth >= 1) {
				const node = GetNode(reveal.path.split('/').Last());
				if (node == null) continue;
				// todo: fix that a child being null, apparently breaks the GetAsync() call in ActionProcessor.ts (for scrolling to just-revealed nodes)
				let currentChildren = GetNodeChildren(node).map((child) => ({ node: child, path: child && `${reveal.path}/${child._key}` }));
				if (currentChildren.Any((a) => a.node == null)) {
					// if (steps.length == 1 && steps[0]._key == 'clDjK76mSsGXicwd7emriw') debugger;
					return emptyArray;
				}

				for (let childrenDepth = 1; childrenDepth <= reveal.revealDepth; childrenDepth++) {
					const nextChildren = [];
					for (const child of currentChildren) {
						if (baseOnLastReveal) {
							nodeRevealTimes[child.path] = Math.max(stepTime_safe, ToNumber(nodeRevealTimes[child.path], 0));
						} else {
							nodeRevealTimes[child.path] = Math.min(stepTime_safe, ToNumber(nodeRevealTimes[child.path], Number.MAX_SAFE_INTEGER));
						}
						// if there's another loop/depth after this one
						if (childrenDepth < reveal.revealDepth) {
							const childChildren = GetNodeChildren(child.node).map((child2) => ({ node: child2, path: child2 && `${child.path}/${child2._key}` }));
							if (childChildren.Any((a) => a == null)) {
								// if (steps.length == 1 && steps[0]._key == 'clDjK76mSsGXicwd7emriw') debugger;
								return emptyArray;
							}
							nextChildren.AddRange(childChildren);
						}
					}
					currentChildren = nextChildren;
				}
			}
		}
	}
	return nodeRevealTimes;
});
export const GetNodesRevealedInSteps = StoreAccessor((s) => (steps: TimelineStep[]) => {
	return GetNodeRevealTimesInSteps(steps).VKeys();
});

export const GetNodeRevealHighlightTime = StoreAccessor((s) => () => {
	return s.main.nodeRevealHighlightTime;
});
export const GetTimeSinceNodeRevealedByPlayingTimeline = StoreAccessor((s) => (mapID: string, nodePath: string, timeSinceLastReveal = false, limitToJustPastHighlightRange = false): number => {
	const appliedSteps = GetPlayingTimelineAppliedSteps(mapID, true);
	const nodeRevealTimes = GetNodeRevealTimesInSteps(appliedSteps, timeSinceLastReveal);
	const nodeRevealTime = nodeRevealTimes[nodePath];
	if (nodeRevealTime == null) return null;

	// const timelineTime = GetPlayingTimelineTime(mapID);
	const timelineTime = s.main.maps.get(mapID).playingTimeline_time;
	let result = timelineTime - nodeRevealTime;
	if (limitToJustPastHighlightRange) {
		result = result.RoundTo(1); // round, to prevent unnecessary re-renders
		result = result.KeepBetween(0, GetNodeRevealHighlightTime() + 1); // cap to 0 through [highlight-time]+1, to prevent unneeded re-renders after X+1
	}
	return result;
});

export const GetTimeFromWhichToShowChangedNodes = StoreAccessor((s) => (mapID: string) => {
	const type = s.main.maps.get(mapID).showChangesSince_type;
	if (type == ShowChangesSinceType.None) return Number.MAX_SAFE_INTEGER; // from end of time (nothing)
	if (type == ShowChangesSinceType.AllUnseenChanges) return 0; // from start of time (everything)
	if (PROD && !GetValues(ShowChangesSinceType).Contains(type)) return Number.MAX_SAFE_INTEGER; // defensive

	const visitOffset = s.main.maps.get(mapID).showChangesSince_visitOffset;
	const lastMapViewTimes = FromJSON(localStorage.getItem(`lastMapViewTimes_${mapID}`) || '[]') as number[];
	if (lastMapViewTimes.length == 0) return Number.MAX_SAFE_INTEGER; // our first visit, so don't show anything

	const timeOfSpecifiedVisit = lastMapViewTimes[visitOffset.KeepAtMost(lastMapViewTimes.length - 1)];
	return timeOfSpecifiedVisit;
});
