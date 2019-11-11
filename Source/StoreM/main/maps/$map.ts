import { types } from 'mobx-state-tree';

/* export class MapState {
	@observable playingTimeline_time: number;
} */
export const MapState = types.model('MapState', {
	// playingTimeline_time: types.optional(types.number, null),
	playingTimeline_time: types.maybeNull(types.number),
}).actions((self) => {
	return {
		playingTimeline_time_set: (val: number) => self.playingTimeline_time = val,
	};
});

/* export const ACTEnsureMapStateInit = StoreAction((mapID: string) => {
	/* if (storeM.main.maps.get(mapID)) return;
	storeM.main.maps.set(mapID, new MapState()); *#/
	// if (storeM.main.maps[mapID]) return;
	if (storeM.main.maps.get(mapID)) return;
	// storeM.main.maps[mapID] = new MapState();
	// storeM.main.maps[mapID] = MapState.create();
	// storeM.main.maps[mapID] = {};
	storeM.main.maps.set(mapID, {});
}) as any; */

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
