import { ObservableMap } from 'mobx';
import { map, model } from 'mst-decorators';
import { MapState, MapState_ } from './main/maps/$map';

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

export class MainStateM {
	// @observable maps = observable.map<string, MapState>();
	// @ref(MapState_) maps = {} as {[key: string]: MapState};
	// @map(MapState_) maps = observable.map<string, MapState>();
	@map(MapState_) maps = {} as ObservableMap<string, MapState>;
	ACTEnsureMapStateInit(mapID: string) {
		if (this.maps.get(mapID)) return;
		this.maps.set(mapID, new MapState());
	}
}
export const MainStateM_ = model(MainStateM);
