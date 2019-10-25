import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { ShowChangesSinceType } from 'Store/main/maps/@MapInfo';
import { emptyArray, GetValues, FromJSON } from 'js-vextensions';
import { Action, CombineReducers, SimpleReducer, State, StoreAccessor } from 'Utils/FrameworkOverrides';
import { GetMap } from '../../firebase/maps';
import { GetNode, GetNodeChildren } from '../../firebase/nodes';
import { GetTimeline, GetTimelineStep } from '../../firebase/timelines';

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

export class ACTMapNodeListSortBySet extends Action<{mapID: string, sortBy: SortType}> {}
export class ACTMapNodeListFilterSet extends Action<{mapID: string, filter: string}> {}
export class ACTMapNodeListPageSet extends Action<{mapID: string, page: number}> {}
export class ACTSelectedNode_InListSet extends Action<{mapID: string, nodeID: string}> {}
export class ACTMap_List_SelectedNode_OpenPanelSet extends Action<{mapID: string, panel: string}> {}

export class ACTMap_TimelinePanelOpenSet extends Action<{mapID: string, open: boolean}> {}
export class ACTMap_TimelineOpenSubpanelSet extends Action<{mapID: string, subpanel: TimelineSubpanel}> {}
export class ACTMap_SelectedTimelineSet extends Action<{mapID: string, selectedTimeline: string}> {}
export class ACTMap_PlayingTimelineSet extends Action<{mapID: string, timelineID: string}> {}
export class ACTMap_PlayingTimelineStepSet extends Action<{mapID: string, stepIndex: number}> {}
export class ACTMap_PlayingTimelineAppliedStepSet extends Action<{mapID: string, stepIndex: number}> {}

/* export function MapInfoReducer(state = null, action: Action<any>, mapID: string): MapInfo {
	if (action.Is(ACTSelectedNode_InListSet)) return {...state, list_selectedNodeID: action.payload.nodeID};
	return state;
} */

export const MapInfoReducer = mapID => CombineReducers({
	list_sortBy: (state = SortType.CreationDate, action) => {
		if (action.Is(ACTMapNodeListSortBySet)) return action.payload.sortBy;
		return state;
	},
	list_filter: (state = '', action) => {
		if (action.Is(ACTMapNodeListFilterSet)) return action.payload.filter;
		return state;
	},
	list_page: (state = 0, action) => {
		if (action.Is(ACTMapNodeListPageSet)) return action.payload.page;
		return state;
	},

	list_selectedNodeID: (state = null, action) => {
		if (action.Is(ACTSelectedNode_InListSet)) return action.payload.nodeID;
		return state;
	},
	list_selectedNode_openPanel: (state = null, action) => {
		if (action.Is(ACTMap_List_SelectedNode_OpenPanelSet)) return action.payload.panel;
		return state;
	},

	timelinePanelOpen: (state = null, action) => {
		if (action.Is(ACTMap_TimelinePanelOpenSet)) return action.payload.open;
		return state;
	},
	timelineOpenSubpanel: (state = null, action) => {
		if (action.Is(ACTMap_TimelineOpenSubpanelSet)) return action.payload.subpanel;
		return state;
	},
	selectedTimeline: (state = null, action) => {
		if (action.Is(ACTMap_SelectedTimelineSet)) return action.payload.selectedTimeline;
		return state;
	},
	playingTimeline: (state = null, action) => {
		if (action.Is(ACTMap_PlayingTimelineSet)) return action.payload.timelineID;
		return state;
	},
	playingTimeline_step: (state = null, action) => {
		if (action.Is(ACTMap_PlayingTimelineStepSet)) return action.payload.stepIndex;
		return state;
	},
	playingTimeline_appliedStep: (state = null, action) => {
		if (action.Is(ACTMap_PlayingTimelineAppliedStepSet)) return action.payload.stepIndex;
		return state;
	},

	showChangesSince_type: SimpleReducer(`main/maps/${mapID}/showChangesSince_type`, ShowChangesSinceType.SinceVisitX),
	showChangesSince_visitOffset: SimpleReducer(`main/maps/${mapID}/showChangesSince_visitOffset`, 1),
});

export function GetSelectedNodeID_InList(mapID: string) {
	return State('main', 'maps', mapID, 'list_selectedNodeID');
}
export function GetSelectedNode_InList(mapID: string) {
	const nodeID = GetSelectedNodeID_InList(mapID);
	return GetNode(nodeID);
}

export function GetMap_List_SelectedNode_OpenPanel(mapID: string) {
	return State('main', 'maps', mapID, 'list_selectedNode_openPanel');
}

export function GetTimelinePanelOpen(mapID: string): boolean {
	if (mapID == null) return false;
	return State('main', 'maps', mapID, 'timelinePanelOpen');
}
export function GetTimelineOpenSubpanel(mapID: string): TimelineSubpanel {
	if (mapID == null) return null;
	return State('main', 'maps', mapID, 'timelineOpenSubpanel');
}
export function GetSelectedTimeline(mapID: string): Timeline {
	if (mapID == null) return null;
	const timelineID = State('main', 'maps', mapID, 'selectedTimeline');
	return GetTimeline(timelineID);
}
export const GetPlayingTimeline = StoreAccessor((mapID: string): Timeline => {
	if (mapID == null) return null;
	const timelineID = State('main', 'maps', mapID, 'playingTimeline');
	return GetTimeline(timelineID);
});
export const GetPlayingTimelineStepIndex = StoreAccessor((mapID: string): number => {
	if (mapID == null) return null;
	return State('main', 'maps', mapID, 'playingTimeline_step');
});
export function GetPlayingTimelineStep(mapID: string) {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return null;
	const stepIndex = GetPlayingTimelineStepIndex(mapID) || 0;
	const stepID = playingTimeline.steps[stepIndex];
	return GetTimelineStep(stepID);
}
export const GetPlayingTimelineCurrentStepRevealNodes = StoreAccessor((mapID: string): string[] => {
	const playingTimeline_currentStep = GetPlayingTimelineStep(mapID);
	if (playingTimeline_currentStep == null) return emptyArray;
	return GetNodesRevealedInSteps([playingTimeline_currentStep]);
});

export function GetPlayingTimelineAppliedStepIndex(mapID: string): number {
	if (mapID == null) return null;
	return State('main', 'maps', mapID, 'playingTimeline_appliedStep');
}
export function GetPlayingTimelineAppliedSteps(mapID: string, excludeAfterCurrentStep = false): TimelineStep[] {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return emptyArray;
	let stepIndex = GetPlayingTimelineAppliedStepIndex(mapID) || -1;
	if (excludeAfterCurrentStep) {
		const currentStep = GetPlayingTimelineStepIndex(mapID);
		stepIndex = Math.min(currentStep, stepIndex);
	}
	const stepIDs = playingTimeline.steps.slice(0, stepIndex + 1);
	const steps = stepIDs.map(a => GetTimelineStep(a));
	if (steps.Any(a => a == null)) return emptyArray;
	return steps;
}
export const GetPlayingTimelineAppliedStepRevealNodes = StoreAccessor((mapID: string, excludeAfterCurrentStep = false): string[] => {
	const map = GetMap(mapID);
	if (!map) return emptyArray;

	const appliedSteps = GetPlayingTimelineAppliedSteps(mapID, excludeAfterCurrentStep);
	return [`${map.rootNode}`].concat(GetNodesRevealedInSteps(appliedSteps));
});

export function GetPlayingTimelineSteps(mapID: string): TimelineStep[] {
	const playingTimeline = GetPlayingTimeline(mapID);
	if (playingTimeline == null) return emptyArray;
	const steps = playingTimeline.steps.map(a => GetTimelineStep(a));
	if (steps.Any(a => a == null)) return emptyArray;
	return steps;
}
export function GetNodesRevealedInSteps(steps: TimelineStep[]): string[] {
	const result = {};
	for (const step of steps) {
		for (const reveal of step.nodeReveals || []) {
			result[reveal.path] = true;
			const node = GetNode(reveal.path.split('/').Last());
			if (node == null) continue;
			let currentChildren = GetNodeChildren(node).map(child => ({ node: child, path: child && `${reveal.path}/${child._key}` }));
			if (currentChildren.Any(a => a.node == null)) return emptyArray;

			for (let childrenDepth = 1; childrenDepth <= reveal.revealDepth; childrenDepth++) {
				const nextChildren = [];
				for (const child of currentChildren) {
					result[child.path] = true;
					// if there's another loop/depth after this one
					if (childrenDepth < reveal.revealDepth) {
						const childChildren = GetNodeChildren(child.node).map(child2 => ({ node: child2, path: child2 && `${child.path}/${child2._key}` }));
						if (childChildren.Any(a => a == null)) return emptyArray;
						nextChildren.AddRange(childChildren);
					}
				}
				currentChildren = nextChildren;
			}
		}
	}
	return result.VKeys();
}
export const GetPlayingTimelineRevealNodes = StoreAccessor((mapID: string, excludeAfterCurrentStep = false): string[] => {
	const map = GetMap(mapID);
	if (!map) return emptyArray;

	const steps = GetPlayingTimelineSteps(mapID);
	return [`${map.rootNode}`].concat(GetNodesRevealedInSteps(steps));
});

export const GetTimeFromWhichToShowChangedNodes = StoreAccessor((mapID: string) => {
	const type = State(`main/maps/${mapID}/showChangesSince_type`) as ShowChangesSinceType;
	if (type == ShowChangesSinceType.None) return Number.MAX_SAFE_INTEGER; // from end of time (nothing)
	if (type == ShowChangesSinceType.AllUnseenChanges) return 0; // from start of time (everything)
	if (PROD && !GetValues(ShowChangesSinceType).Contains(type)) return Number.MAX_SAFE_INTEGER; // defensive

	const visitOffset = State(`main/maps/${mapID}/showChangesSince_visitOffset`) as number;
	const lastMapViewTimes = FromJSON(localStorage.getItem(`lastMapViewTimes_${mapID}`) || '[]') as number[];
	if (lastMapViewTimes.length == 0) return Number.MAX_SAFE_INTEGER; // our first visit, so don't show anything

	const timeOfSpecifiedVisit = lastMapViewTimes[visitOffset.KeepAtMost(lastMapViewTimes.length - 1)];
	return timeOfSpecifiedVisit;
});
