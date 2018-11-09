import { VURL } from "js-vextensions";
import { combineReducers } from "redux";
import { LOCATION_CHANGED } from "redux-little-router";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { rootPageDefaultChilds } from "Utils/URL/URLManager";
import { Action } from "../Utils/Store/Action";
import { State } from "./index";
import SubpageReducer from "./main/@Shared/$subpage";
import { MapViewsReducer } from "./main/mapViews";
import { MapViews } from "./main/mapViews/@MapViews";

export enum WeightingType {
	Votes = 10,
	ReasonScore = 20,
}

// class is used only for initialization
export class MainState {
	page: string;
	// url props
	urlExtraStr: string;
	envOverride: string;
	dbVersionOverride: string;

	// pages (and nav-bar panels)
	// ==========

	home: {subpage: string};
	gad: {subpage: string};

	// maps
	// ==========

	mapViews: MapViews;
}
export class ACTSetPage extends Action<string> {}
export class ACTSetSubpage extends Action<{page: string, subpage: string}> {}

let MainReducer_Real;
export function MainReducer(state, action) {
	MainReducer_Real = MainReducer_Real || persistReducer({key: "main_key", storage, blacklist: ["notificationMessages", "currentNodeBeingAdded_path"]}, combineReducers({
		page: (state = null, action)=> {
			if (action.Is(ACTSetPage)) return action.payload;
			return state;
		},

		// use this for eg. conditional debug displaying on live site
		urlExtraStr: (state = null, action)=> {
			if (action.type == LOCATION_CHANGED && VURL.FromState(action.payload).GetQueryVar("extra")) {
				let newVal = VURL.FromState(action.payload).GetQueryVar("extra");
				if (newVal == "null") newVal = null;
				return newVal;
			}
			return state;
		},
		envOverride: (state = null, action)=> {
			if (action.type == LOCATION_CHANGED && VURL.FromState(action.payload).GetQueryVar("env")) {
				let newVal = VURL.FromState(action.payload).GetQueryVar("env");
				if (newVal == "null") newVal = null;
				return newVal;
			}
			return state;
		},
		dbVersionOverride: (state = null, action)=> {
			if (action.type == LOCATION_CHANGED && VURL.FromState(action.payload).GetQueryVar("dbVersion")) {
				let str = VURL.FromState(action.payload).GetQueryVar("dbVersion");
				return str == "null" ? null : parseInt(str);
			}
			return state;
		},

		// pages (and nav-bar panels)
		// ==========

		home: combineReducers({subpage: SubpageReducer("home")}),
		gad: combineReducers({subpage: SubpageReducer("gad")}),
		
		// maps
		// ==========

		mapViews: MapViewsReducer,
	}));
	return MainReducer_Real(state, action);
}

// selectors
// ==========

export function GetPage() {
	return State(a=>a.main.page) || "home";
}
export function GetSubpage() {
	let page = GetPage();
	return (State("main", page, "subpage") as string) || rootPageDefaultChilds[page];
}