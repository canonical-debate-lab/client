import { types } from 'mobx-state-tree';
import { model, view, ref, bool, array, map, maybe, num, id, str, jsonDate } from 'mst-decorators';

/* export class MapState {
	@observable playingTimeline_time: number;
} */

/* export const MapState = types.model('MapState', {
	// playingTimeline_time: types.optional(types.number, null),
	// playingTimeline_time: types.maybeNull(types.number).WithMeta({version: 1}),
	playingTimeline_time: types.maybeNull(types.number),
}).actions((self) => {
	return {
		playingTimeline_time_set: (val: number) => self.playingTimeline_time = val,
	};
}); */

export class MapState {
	// @observable playingTimeline_time: number;
	@maybe(num) playingTimeline_time: number;
	// playingTimeline_time_set(val: number) { this.playingTimeline_time = val; }
	@maybe(num) playingTimeline_step: number;
	@maybe(num) playingTimeline_appliedStep: number;
}
export const MapStateM = model(MapState);

/* export const GetPlayingTimelineTime = StoreAccessor((mapID: string): number => {
	if (mapID == null) return null;
	// return storeM.main.maps[mapID].playingTimeline_time;
	return storeM.main.maps.get(mapID).playingTimeline_time;
});
export const ACTSetPlayingTimelineTime = StoreAction(s => (mapID: string, time: number) => {
	// storeM.main.maps[mapID].playingTimeline_time = time;
	// storeM.main.maps.get(mapID).playingTimeline_time = time;
	s.main.maps.get(mapID).playingTimeline_time = time;
}); */
