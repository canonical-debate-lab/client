import { observable } from 'mobx';
import { types, getSnapshot } from 'mobx-state-tree';
import { MapState } from './main/maps/$map';

/* export class MainStateM {
	// @observable maps = observable.map<string, MapState>();
	@observable maps = {} as {[key: string]: MapState};
} */

export const MainStateM = types.model('MainStateM', {
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
});
