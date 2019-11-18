import { ObservableMap } from 'mobx';
import { map, model, string, maybe, maybeNull, number, bool, array, enumeration } from 'mst-decorators';
import { MapState, MapStateM } from './main/maps/$map';
import { PersonalStateM, PersonalState } from './main/personal';
import { DebatesStateM, DebatesState } from './main/debates';

export enum WeightingType {
	Votes = 10,
	ReasonScore = 20,
}
export const WeightingTypeM = enumeration('WeightingType', [WeightingType.Votes, WeightingType.ReasonScore]);

export class MainState {
	@string page = 'home';
	@string urlExtraStr: string;

	@number lastDBVersion: number; // tracks the last db-version the client started with, so we can know when we need to upgrade the store-data
	@string envOverride: string;
	@string dbOverride: string;
	@string dbVersionOverride: string;

	@bool analyticsEnabled: boolean;
	// topLeftOpenPanel: string;
	// topRightOpenPanel: string;
	@RatingUIStateM ratingUI: RatingUIState;
	@array(NotificationMessageM) notificationMessages: NotificationMessage[];

	// pages (and nav-bar panels)
	// ==========

	// stream: {subpage: string};
	// chat: {subpage: string};
	// reputation: {subpage: string};

	@DatabaseStateM database: DatabaseState;
	@FeedbackStateM feedback: FeedbackState;
	// forum: Forum;
	@MoreStateM more: MoreState;
	@HomeStateM home: HomeState;
	// @SocialStateM social: SocialState;
	@PersonalStateM personal: PersonalState;
	@DebatesStateM debates: DebatesState;
	@GlobalStateM global: GlobalState;

	@SearchStateM search: SearchState;
	// guide: {subpage: string};
	@ProfileStateM profile: ProfileState;

	@maybeNull(string) topLeftOpenPanel: string;
	// set topLeftOpenPanel_set(val) { this.topLeftOpenPanel = val; }
	@maybeNull(string) topRightOpenPanel: string;
	// set topRightOpenPanel_set(val) { this.topRightOpenPanel = val; }

	// @observable maps = observable.map<string, MapState>();
	// @ref(MapState_) maps = {} as {[key: string]: MapState};
	// @map(MapState_) maps = observable.map<string, MapState>();
	@map(MapStateM) maps = {} as ObservableMap<string, MapState>;
	ACTEnsureMapStateInit(mapID: string) {
		if (this.maps.get(mapID)) return;
		this.maps.set(mapID, new MapState());
	}

	// maps
	// ==========

	@string copiedNodePath: string;
	@bool copiedNodePath_asCut: boolean;

	@bool lockMapScrolling: boolean;
	@number initialChildLimit: number;
	@bool showReasonScoreValues: boolean;
	@WeightTypeM weighting: WeightingType;

	// timelines
	nodeRevealHighlightTime: number;
}
export const MainStateM = model(MainState);
