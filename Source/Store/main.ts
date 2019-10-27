import { LOCATION_CHANGE } from 'connected-react-router';
import { VURL } from 'js-vextensions';
import { ShallowChanged } from 'react-vextensions';
import { MapInfoReducer } from '../Store/main/maps/$map';
import { MapInfo } from '../Store/main/maps/@MapInfo';
import { Personal } from '../Store/main/personal';
import { Action, CombineReducers, SimpleReducer, State, StoreAccessor } from '../Utils/FrameworkOverrides';
import { rootPageDefaultChilds } from '../Utils/URL/URLs';
import { GetNodeL3 } from './firebase/nodes/$node';
import { globalMapID } from './firebase/nodes/@MapNode';
import { NotificationMessage } from './main/@NotificationMessage';
import { SubpageReducer } from './main/@Shared/$subpage';
import { Database, DatabaseReducer } from './main/database';
import { ACTDebateMapSelect, Debates, DebatesReducer } from './main/debates';
import { MapViewsReducer } from './main/mapViews';
import { MapViews } from './main/mapViews/@MapViews';
import { ACTPersonalMapSelect, PersonalReducer } from './main/personal';
import { RatingUIReducer, RatingUIState } from './main/ratingUI';
import { SearchReducer, SearchStorage } from './main/search';

export enum WeightingType {
	Votes = 10,
	ReasonScore = 20,
}

// class is used only for initialization
export class MainState {
	page: string;
	urlExtraStr: string;

	lastDBVersion: number; // tracks the last db-version the client started with, so we can know when we need to upgrade the store-data
	envOverride: string;
	dbOverride: string;
	dbVersionOverride: string;

	analyticsEnabled: boolean;
	topLeftOpenPanel: string;
	topRightOpenPanel: string;
	ratingUI: RatingUIState;
	notificationMessages: NotificationMessage[];

	// pages (and nav-bar panels)
	// ==========

	stream: {subpage: string};
	chat: {subpage: string};
	reputation: {subpage: string};

	database: Database;
	feedback: {subpage: string};
	// forum: Forum;
	more: {subpage: string};
	home: {subpage: string};
	social: {subpage: string};
	personal: Personal;
	debates: Debates;
	global: {subpage: string};

	search: SearchStorage;
	guide: {subpage: string};
	profile: {subpage: string};

	// maps
	// ==========

	maps: {[key: number]: MapInfo};

	nodeLastAcknowledgementTimes: {[key: number]: number};
	currentNodeBeingAdded_path: string;

	// openMap: number;
	mapViews: MapViews;
	copiedNodePath: string;
	copiedNodePath_asCut: boolean;

	lockMapScrolling: boolean;
	initialChildLimit: number;
	showReasonScoreValues: boolean;
	weighting: WeightingType;
}
export class ACTSetPage extends Action<string> {}
export class ACTSetSubpage extends Action<{page: string, subpage: string}> {}
export class ACTTopLeftOpenPanelSet extends Action<string> {}
export class ACTTopRightOpenPanelSet extends Action<string> {}
// export class ACTOpenMapSet extends Action<number> {}
export class ACTNodeCopy extends Action<{path: string, asCut: boolean}> {}
export class ACTSetInitialChildLimit extends Action<{value: number}> {}
export class ACTSetLastAcknowledgementTime extends Action<{nodeID: string, time: number}> {}
// export class ACTSetCurrentNodeBeingAdded extends Action<{path: string}> {}

export const MainReducer = CombineReducers({
	page: (state = null, action) => {
		if (action.Is(ACTSetPage)) return action.payload;
		return state;
	},

	/* _: (state = null, action)=> {
		PreDispatchAction(action);
		return null;
	}, */
	// use this for eg. conditional debug displaying on live site
	urlExtraStr: (state = null, action) => {
		// if ((action.type == "@@INIT" || action.type == "persist/REHYDRATE") && startURL.GetQueryVar("env"))
		// if ((action.type == "PostRehydrate") && startURL.GetQueryVar("env"))
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('extra')) {
			let newVal = VURL.FromLocationObject(action.payload.location).GetQueryVar('extra');
			if (newVal == 'null') newVal = null;
			return newVal;
		}
		return state;
	},

	lastDBVersion: SimpleReducer(a => a.main.lastDBVersion), // tracks the last db-version the client started with, so we can know when we need to upgrade the store-data
	envOverride: (state = null, action) => {
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('env')) {
			let newVal = VURL.FromLocationObject(action.payload.location).GetQueryVar('env');
			if (newVal == 'null') newVal = null;
			return newVal;
		}
		return state;
	},
	dbOverride: (state = null, action) => {
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('db')) {
			let newVal = VURL.FromLocationObject(action.payload.location).GetQueryVar('db');
			if (newVal == 'null') newVal = null;
			return newVal;
		}
		return state;
	},
	dbVersionOverride: (state = null, action) => {
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('dbVersion')) {
			const str = VURL.FromLocationObject(action.payload.location).GetQueryVar('dbVersion');
			return str == 'null' ? null : parseInt(str);
		}
		return state;
	},
	analyticsEnabled: (state = true, action) => {
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('analytics') == 'false') { return false; }
		if (action.type == LOCATION_CHANGE && VURL.FromLocationObject(action.payload.location).GetQueryVar('analytics') == 'true') { return true; }
		return state;
	},
	topLeftOpenPanel: (state = null, action) => {
		if (action.Is(ACTTopLeftOpenPanelSet)) { return action.payload; }
		return state;
	},
	topRightOpenPanel: (state = null, action) => {
		if (action.Is(ACTTopRightOpenPanelSet)) { return action.payload; }
		return state;
	},
	ratingUI: RatingUIReducer,

	// pages (and nav-bar panels)
	// ==========

	stream: CombineReducers({ subpage: SubpageReducer('stream') }),
	chat: CombineReducers({ subpage: SubpageReducer('chat') }),
	reputation: CombineReducers({ subpage: SubpageReducer('reputation') }),

	database: DatabaseReducer,
	// forum: ForumReducer,
	feedback: CombineReducers({ subpage: SubpageReducer('feedback') }),
	more: CombineReducers({ subpage: SubpageReducer('more') }),
	home: CombineReducers({ subpage: SubpageReducer('home') }),
	social: CombineReducers({ subpage: SubpageReducer('social') }),
	personal: PersonalReducer,
	debates: DebatesReducer,
	global: CombineReducers({ subpage: SubpageReducer('global') }),

	search: SearchReducer,
	guide: CombineReducers({ subpage: SubpageReducer('guide') }),
	profile: CombineReducers({ subpage: SubpageReducer('profile') }),

	// maps
	// ==========

	maps: (state = {}, action) => {
		const newState = { ...state };
		/* if (action.Is(ACTSetPage) && action.payload == "global" && state[globalMapID] == null) {
			state = {...state, [globalMapID]: new MapInfo()};
		} */
		// if (state[demoMap._id] == null) newState[demoMap._id] = new MapInfo().Strip();
		if (state[globalMapID] == null) newState[globalMapID] = new MapInfo().Strip();
		if ((action.Is(ACTPersonalMapSelect) || action.Is(ACTDebateMapSelect)) && newState[action.payload.id] == null) {
			newState[action.payload.id] = new MapInfo().Strip();
		}

		for (const key in newState) {
			// action.VSet("parentKey", parseInt(key), {prop: {}});
			if (action.payload && action.payload.mapID && key != action.payload.mapID) continue;
			newState[key] = MapInfoReducer(key)(newState[key], action); // , parseInt(key));
		}
		return ShallowChanged(newState, state) ? newState : state;
	},

	nodeLastAcknowledgementTimes: (state = {}, action) => {
		if (action.Is(ACTSetLastAcknowledgementTime)) {
			state = { ...state, [action.payload.nodeID]: action.payload.time };
		}
		return state;
	},
	currentNodeBeingAdded_path: SimpleReducer(a => a.main.currentNodeBeingAdded_path),

	/* openMap: (state = null, action)=> {
		if (action.Is(ACTSetPage) && action.payload == "global") return globalMapID;
		//if (action.Is(ACTOpenMapSet)) return action.payload;
		return state;
	}, */
	mapViews: MapViewsReducer,
	copiedNodePath: (state = null as string, action) => {
		if (action.Is(ACTNodeCopy)) return action.payload.path;
		return state;
	},
	copiedNodePath_asCut: (state = null as string, action) => {
		if (action.Is(ACTNodeCopy)) return action.payload.asCut;
		return state;
	},

	lockMapScrolling: SimpleReducer(a => a.main.lockMapScrolling, true),
	initialChildLimit: SimpleReducer(a => a.main.initialChildLimit, 5),
	showReasonScoreValues: SimpleReducer(a => a.main.showReasonScoreValues, false),
	weighting: SimpleReducer(a => a.main.weighting, WeightingType.Votes),
});

// selectors
// ==========

export const GetOpenMapID = StoreAccessor(() => {
	// return State(a=>a.main.openMap);
	const page = State(a => a.main.page);
	// if (page == 'home') return demoMap._id;
	if (page == 'personal') return State(a => a.main.personal.selectedMapID);
	if (page == 'debates') return State(a => a.main.debates.selectedMapID);
	if (page == 'global') return globalMapID;
	return null;
});

export function GetPage() {
	return State(a => a.main.page) || 'home';
}
export function GetSubpage() {
	const page = GetPage();
	return (State('main', page, 'subpage') as string) || rootPageDefaultChilds[page];
}

export const GetLastAcknowledgementTime = StoreAccessor((nodeID: string) => {
	return State('main', 'nodeLastAcknowledgementTimes', nodeID) as number || 0;
});

/* export const GetLastAcknowledgementTime2 = StoreAccessor((nodeID: string) => {
	GetCopiedNodePath();
	return State('main', 'nodeLastAcknowledgementTimes', nodeID) as number || 0;
}); */

export const GetCopiedNodePath = StoreAccessor(() => {
	return State(a => a.main.copiedNodePath);
});
export const GetCopiedNode = StoreAccessor(() => {
	const path = GetCopiedNodePath();
	if (!path) return null;
	return GetNodeL3(path);
});
