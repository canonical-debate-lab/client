import { emptyArray, FromJSON, GetValues, ToNumber } from 'js-vextensions';
import { GetMap } from 'Store/firebase/maps';
import { GetNode, GetNodeChildren } from 'Store/firebase/nodes';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { O } from 'vwebapp-framework';
import { StoreAccessor } from 'mobx-firelink';
import { GetNodesRevealedInSteps, GetNodeRevealTimesInSteps, GetTimelineSteps, GetTimelineStep } from 'Store/firebase/timelineSteps';
import { GetTimeline } from 'Store/firebase/timelines';

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
	@O initDone = false;

	@O list_sortBy = SortType.CreationDate;
	@O list_filter = '';
	@O list_page = 0;

	@O list_selectedNodeID = null as string;
	@O list_selectedNode_openPanel = null as string;

	@O timelinePanelOpen = false;
	@O timelineOpenSubpanel = TimelineSubpanel.Collection;
	@O showTimelineDetails = false;
	@O selectedTimeline = null as string;

	@O showChangesSince_type = ShowChangesSinceType.SinceVisitX;
	@O showChangesSince_visitOffset = 1;

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

	const playingTimeline = GetPlayingTimeline(mapID);
	const steps = playingTimeline ? GetTimelineSteps(playingTimeline) : emptyArray;
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
