import { immerable } from 'immer';
import { Global } from 'js-vextensions';
import { observable } from 'mobx';
import { ignore } from 'mobx-sync';
import { O, StoreAction } from 'vwebapp-framework';
import { rootPageDefaultChilds } from 'Utils/URL/URLs';
import { StoreAccessor } from 'mobx-firelink';
import { store } from 'Store';
import { GetNodeL3 } from './firebase/nodes/$node';
import { globalMapID } from './firebase/nodes/@MapNode';
import { DatabaseState } from './main/database';
import { DebatesState } from './main/debates';
import { MapState } from './main/maps/$map';
import { MapView, GetMapView } from './main/mapViews/$mapView';
import { PersonalState } from './main/personal';
import { RatingUIState } from './main/ratingUI';
import { SearchState } from './main/search';

export enum WeightingType {
	Votes = 10,
	ReasonScore = 20,
}

@Global
export class NotificationMessage {
	static lastID = -1;

	constructor(text: string) {
		this.id = ++NotificationMessage.lastID;
		this.text = text;
	}

	id: number;
	text: string;
}

export class MainState {
	// [immerable] = true;

	@O page = 'home';
	@O urlExtraStr: string;

	@O lastDBVersion: number; // tracks the last db-version the client started with, so we can know when we need to upgrade the store-data
	@O envOverride: string;
	@O dbOverride: string;
	@O dbVersionOverride: string;

	@O analyticsEnabled = true;
	// topLeftOpenPanel: string;
	// topRightOpenPanel: string;
	@O ratingUI = new RatingUIState();
	@O @ignore notificationMessages: NotificationMessage[];

	// pages (and nav-bar panels)
	// ==========

	// stream: {subpage: string};
	// chat: {subpage: string};
	// reputation: {subpage: string};

	@O database = new DatabaseState();
	@O feedback = {} as {subpage: string};
	// forum: Forum;
	@O more = {} as {subpage: string};
	@O home = {} as {subpage: string};
	// @SocialStateM social: SocialState;
	@O personal = new PersonalState();
	@O debates = new DebatesState();
	@O global = {} as {subpage: string};

	@O search = new SearchState();
	// guide: {subpage: string};
	@O profile = {} as {subpage: string};

	@O topLeftOpenPanel: string;
	// set topLeftOpenPanel_set(val) { this.topLeftOpenPanel = val; }
	@O topRightOpenPanel: string;
	// set topRightOpenPanel_set(val) { this.topRightOpenPanel = val; }

	// @Oervable maps = observable.map<string, MapState>();
	// @ref(MapState_) maps = {} as {[key: string]: MapState};
	// @map(MapState_) maps = observable.map<string, MapState>();


	// maps
	// ==========

	// @O maps = {} as ObservableMap<string, MapState>;
	@O maps = observable.map<string, MapState>();
	/* ACTEnsureMapStateInit(mapID: string) {
		if (this.maps.get(mapID)) return;
		this.maps.set(mapID, new MapState());
	} */
	@O mapViews = observable.map<string, MapView>();

	@O nodeLastAcknowledgementTimes = observable.map<string, number>();
	@O @ignore currentNodeBeingAdded_path: string;

	// openMap: number;

	@O copiedNodePath: string;
	@O copiedNodePath_asCut: boolean;

	@O lockMapScrolling = true;
	@O initialChildLimit = 5;
	@O showReasonScoreValues = false;
	@O weighting = WeightingType.Votes;

	// timelines
	@O nodeRevealHighlightTime = 20;
}

export const GetOpenMapID = StoreAccessor((s) => () => {
	// return State(a=>a.main.openMap);
	const page = s.main.page;
	// if (page == 'home') return demoMap._id;
	/* if (page == 'personal') return State((a) => a.main.personal.selectedMapID);
	if (page == 'debates') return State((a) => a.main.debates.selectedMapID); */
	if (page == 'personal') return s.main.personal.selectedMapID;
	if (page == 'debates') return s.main.debates.selectedMapID;
	if (page == 'global') return globalMapID;
	return null;
});

// export type PageKey = "home" | ""
export const GetPage = StoreAccessor((s) => () => {
	return s.main.page || 'home';
});
export const GetSubpage = StoreAccessor((s) => () => {
	const page = GetPage();
	return s.main[page].subpage as string || rootPageDefaultChilds[page];
});

export const GetLastAcknowledgementTime = StoreAccessor((s) => (nodeID: string) => {
	return s.main.nodeLastAcknowledgementTimes.get(nodeID) || 0;
});

/* export const GetLastAcknowledgementTime2 = StoreAccessor((nodeID: string) => {
	GetCopiedNodePath();
	return State('main', 'nodeLastAcknowledgementTimes', nodeID) as number || 0;
}); */

export const GetCopiedNodePath = StoreAccessor((s) => () => {
	return s.main.copiedNodePath;
});
export const GetCopiedNode = StoreAccessor((s) => () => {
	const path = GetCopiedNodePath();
	if (!path) return null;
	return GetNodeL3(path);
});

// actions
// ==========

export const ACTEnsureMapStateInit = StoreAction((mapID: string) => {
	if (store.main.maps.get(mapID)) return;
	store.main.maps.set(mapID, new MapState());
});
export const ACTCreateMapViewIfMissing = StoreAction((mapID: string) => {
	if (GetMapView(mapID) == null) {
		store.main.mapViews.set(mapID, new MapView());
	}
});
