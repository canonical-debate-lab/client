import { ObservableMap } from 'mobx';
import { map, model, string, maybe, maybeNull } from 'mst-decorators';
import { MapState, MapStateM } from './main/maps/$map';
import { PersonalStateM, PersonalState } from './main/personal';
import { DebatesStateM, DebatesState } from './main/debates';

/* export class MainStateM {
	// @observable maps = observable.map<string, MapState>();
	@observable maps = {} as {[key: string]: MapState};
} */

/* export const MainStateM = types.model('MainStateM', {
	maps: types.map(types.late(() => MapState)),
}).actions((self) => {
	return {
		ACTEnsureMapStateInit(mapID: string) {
			if (self.maps.get(mapID)) return;
			// if (getSnapshot(self.maps)[mapID]) return;
			debugger;
			self.maps.set(mapID, {});
		},
	};
}); */

export class MainState {
	@string page = 'home';

	@PersonalStateM personal: PersonalState;
	@DebatesStateM debates: DebatesState;

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
}
export const MainStateM = model(MainState);
