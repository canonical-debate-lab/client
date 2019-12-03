import { UserEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import { Command, GetAsync, GetDocs_Async, GetDoc_Async } from 'mobx-firelink';
import { ObservableMap } from 'mobx';
import { ForDeleteLayer_GetError } from '../../Store/firebase/layers';
import { Layer } from '../../Store/firebase/layers/@Layer';
import { UserMapInfoSet } from '../../Store/firebase/userMapInfo/@UserMapInfo';


@UserEdit
export class DeleteLayer extends Command<{layerID: string}, {}> {
	oldData: Layer;
	userMapInfoSets: UserMapInfoSet[];
	async Prepare() {
		const { layerID } = this.payload;
		this.oldData = await GetDoc_Async({}, (a) => a.layers.get(layerID));
		this.userMapInfoSets = await GetDocs_Async({}, (a) => a.userMapInfo);
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
		for (const mapID of this.oldData.mapsWhereEnabled.keys()) {
			updates[`maps/${mapID}/.layers/.${layerID}`] = null;
		}
		for (const userMapInfoSet of this.userMapInfoSets) {
			const userID = userMapInfoSet._key;
			for (const [mapID2, userMapInfo] of userMapInfoSet.maps.entries()) {
				if (userMapInfo.layerStates[layerID] != null) {
					updates[`userMapInfo/${userID}/.${mapID2}/.layerStates/.${layerID}`] = null;
				}
			}
		}
		return updates;
	}
}
