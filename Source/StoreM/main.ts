import { observable } from 'mobx';
import { MapState } from './main/maps/$map';

export class MainStateM {
	// @observable maps = observable.map<string, MapState>();
	@observable maps = {} as {[key: string]: MapState};
}
