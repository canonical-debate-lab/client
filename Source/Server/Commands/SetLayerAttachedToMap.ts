import { MapEdit } from 'Server/CommandMacros';
import { Assert } from 'js-vextensions';
import { AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { Map } from '../../Store/firebase/maps/@Map';
import { Command } from '../Command';
import { UserEdit } from '../CommandMacros';

AddSchema({
	properties: {
		mapID: { type: 'number' },
		layerID: { type: 'number' },
		attached: { type: 'boolean' },
	},
	required: ['mapID', 'layerID', 'attached'],
}, 'SetLayerAttachedToMap_payload');

@MapEdit
@UserEdit
export class SetLayerAttachedToMap extends Command<{mapID: number, layerID: number, attached: boolean}, {}> {
	Validate_Early() {
		AssertValidate('SetLayerAttachedToMap_payload', this.payload, 'Payload invalid');
	}

	oldData: Map;
	async Prepare() {
		const { mapID } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'maps', mapID) as Map;
	}
	async Validate() {
		Assert(this.oldData, 'Map does not exist!');
	}

	GetDBUpdates() {
		const { mapID, layerID, attached } = this.payload;
		const updates = {};
		updates[`maps/${mapID}/.layers/.${layerID}`] = attached || null;
		updates[`layers/${layerID}/.mapsWhereEnabled/.${mapID}`] = attached || null;
		return updates;
	}
}
