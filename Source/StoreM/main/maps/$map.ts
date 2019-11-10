import { observable } from 'mobx';
import { StoreAccessor, StoreAction } from 'Utils/FrameworkOverrides';
import { storeM } from 'StoreM/StoreM';

export class MapState {
	/* list_sortBy: SortType;
	list_filter: string;
	list_page: number;
	list_selectedNodeID: string;
	list_selectedNode_openPanel: string;

	timelinePanelOpen: boolean;
	timelineOpenSubpanel: TimelineSubpanel;
	showTimelineDetails: boolean;
	selectedTimeline: string;
	// playingTimeline: number;
	playingTimeline_time: number;
	playingTimeline_step: number; // step currently scrolled to
	playingTimeline_appliedStep: number; // max step scrolled to

	showChangesSince_type: ShowChangesSinceType;
	showChangesSince_visitOffset: number; */

	@observable playingTimeline_time: number;
}

export const ACTEnsureMapStateInit = StoreAction((mapID: string) => {
	if (storeM.main.maps.get(mapID)) return;
	storeM.main.maps.set(mapID, new MapState());
});

export const GetPlayingTimelineTime = StoreAccessor((mapID: string): number => {
	if (mapID == null) return null;
	return storeM.main.maps.get(mapID).playingTimeline_time;
});
export const ACTSetPlayingTimelineTime = StoreAction((mapID: string, time: number) => {
	storeM.main.maps.get(mapID).playingTimeline_time = time;
});
