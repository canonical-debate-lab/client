import { UserEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import {GetAsync, GetDataAsync} from 'Utils/FrameworkOverrides';
import { ForDeleteLayer_GetError } from '../../Store/firebase/layers';
import { Layer } from '../../Store/firebase/layers/@Layer';
import { UserMapInfoSet } from '../../Store/firebase/userMapInfo/@UserMapInfo';
import { Command } from '../Command';

@UserEdit
export class DeleteLayer extends Command<{layerID: number}, {}> {
	oldData: Layer;
	userMapInfoSets: {[key: string]: UserMapInfoSet};
	async Prepare() {
		const { layerID } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'layers', layerID) as Layer;
		this.userMapInfoSets = await GetDataAsync('userMapInfo') as {[key: string]: UserMapInfoSet};
	}
	async Validate() {
		const { layerID } = this.payload;
		const earlyError = await GetAsync(() => ForDeleteLayer_GetError(this.userInfo.id, this.oldData));
		Assert(earlyError == null, earlyError);
	}

	GetDBUpdates() {
		const { layerID } = this.payload;
		const updates = {};
		updates[`layers/${layerID}`] = null;
		for (const mapID of (this.oldData.mapsWhereEnabled || {}).VKeys()) {
			updates[`maps/${mapID}/.layers/.${layerID}`] = null;
		}
		for (const { name: userID, value: userMapInfoSet } of this.userMapInfoSets.Props(true)) {
			for (const { name: mapID2, value: userMapInfo } of userMapInfoSet.Props(true)) {
				if (userMapInfo.layerStates[layerID] != null) {
					updates[`userMapInfo/${userID}/.${mapID2}/.layerStates/.${layerID}`] = null;
				}
			}
		}
		return updates;
	}
}
