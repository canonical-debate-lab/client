import {UUID} from 'Utils/General/KeyGenerator';
import { SortType, TimelineSubpanel } from './$map';

export enum ShowChangesSinceType {
	None = 10,
	SinceVisitX = 20,
	AllUnseenChanges = 30,
}

export class MapInfo {
	list_sortBy: SortType;
	list_filter: string;
	list_page: number;
	list_selectedNodeID: string;
	list_selectedNode_openPanel: string;

	timelinePanelOpen: boolean;
	timelineOpenSubpanel: TimelineSubpanel;
	selectedTimeline: string;
	// playingTimeline: number;
	playingTimeline_step: number;
	playingTimeline_appliedStep: number;

	showChangesSince_type: ShowChangesSinceType;
	showChangesSince_visitOffset: number;
}
