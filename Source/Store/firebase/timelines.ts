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
