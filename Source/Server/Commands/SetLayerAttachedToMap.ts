import { Assert } from 'js-vextensions';
import { MapEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate, Command, GetDataAsync } from 'Utils/FrameworkOverrides';
import { Map } from '../../Store_Old/firebase/maps/@Map';
import { UserEdit } from '../CommandMacros';

AddSchema('SetLayerAttachedToMap_payload', {
	properties: {
		mapID: { type: 'string' },
		layerID: { type: 'string' },
		attached: { type: 'boolean' },
	},
	required: ['mapID', 'layerID', 'attached'],
});

@MapEdit
@UserEdit
export class SetLayerAttachedToMap extends Command<{mapID: string, layerID: string, attached: boolean}, {}> {
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
