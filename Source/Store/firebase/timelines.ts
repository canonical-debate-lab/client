import { CachedTransform, emptyArray } from 'js-vextensions';
import {GetData} from 'Utils/FrameworkOverrides';
import { Map } from './maps/@Map';
import { Timeline } from './timelines/@Timeline';
import { TimelineStep } from './timelineSteps/@TimelineStep';

/* export function GetTimelines(): Timeline[] {
	let timelinesMap = GetData({collection: true}, "timelines");
	return CachedTransform("GetTimelines", [], timelinesMap, ()=>timelinesMap ? timelinesMap.VValues(true) : []);
} */
export function GetTimeline(id: number): Timeline {
	if (id == null) return null;
	return GetData('timelines', id);
}

export function GetMapTimelineIDs(map: Map) {
	return (map.timelines || {}).VKeys(true).map(ToInt);
}
export function GetMapTimelines(map: Map) {
	const timelines = GetMapTimelineIDs(map).map(id => GetTimeline(id));
	if (timelines.Any(a => a == null)) return emptyArray;
	return CachedTransform('GetTimelinesForMap', [map._id], timelines, () => timelines);
}

export function GetTimelineStep(id: number): TimelineStep {
	if (id == null) return null;
	return GetData('timelineSteps', id);
}
export function GetTimelineSteps(timeline: Timeline): TimelineStep[] {
	const steps = (timeline.steps || []).map(id => GetTimelineStep(id));
	if (steps.Any(a => a == null)) return emptyArray;
	return CachedTransform('GetTimelineSteps', [timeline._id], steps, () => steps);
}
