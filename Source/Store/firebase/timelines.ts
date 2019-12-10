import { CachedTransform, emptyArray, ToInt } from 'js-vextensions';
import { GetDoc, StoreAccessor } from 'mobx-firelink';
import { Map } from './maps/@Map';
import { Timeline } from './timelines/@Timeline';
import { TimelineStep } from './timelineSteps/@TimelineStep';

/* export function GetTimelines(): Timeline[] {
	let timelinesMap = GetData({collection: true}, "timelines");
	return CachedTransform("GetTimelines", [], timelinesMap, ()=>timelinesMap ? timelinesMap.VValues(true) : []);
} */
export const GetTimeline = StoreAccessor((s) => (id: string): Timeline => {
	if (id == null) return null;
	return GetDoc({}, (a) => a.timelines.get(id));
});

export function GetMapTimelineIDs(map: Map) {
	return (map.timelines || {}).VKeys(true);
}
export const GetMapTimelines = StoreAccessor((s) => (map: Map) => {
	const timelines = GetMapTimelineIDs(map).map((id) => GetTimeline(id));
	if (timelines.Any((a) => a == null)) return emptyArray;
	return timelines;
});

export const GetTimelineStep = StoreAccessor((s) => (id: string): TimelineStep => {
	if (id == null) return null;
	return GetDoc({}, (a) => a.timelineSteps.get(id));
});
export const GetTimelineSteps = StoreAccessor((s) => (timeline: Timeline, allowStillLoading = false): TimelineStep[] => {
	const steps = (timeline.steps || []).map((id) => GetTimelineStep(id));
	if (!allowStillLoading && steps.Any((a) => a == null)) return emptyArray;
	return steps;
});
