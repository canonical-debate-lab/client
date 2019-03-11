import { MapEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate, Command, GetDataAsync, Schema } from 'Utils/FrameworkOverrides';
import { Map, Map_namePattern } from '../../Store/firebase/maps/@Map';
import { UserEdit } from '../CommandMacros';

AddSchema({
	properties: {
		mapID: { type: 'string' },
		mapUpdates: Schema({
			properties: {
				name: { type: 'string', pattern: Map_namePattern },
				note: { type: 'string' },
				noteInline: { type: 'boolean' },
				defaultExpandDepth: { type: 'number' },
			},
		}),
	},
	required: ['mapID', 'mapUpdates'],
}, 'UpdateMapDetails_payload');

@MapEdit
@UserEdit
export class UpdateMapDetails extends Command<{mapID: string, mapUpdates: Partial<Map>}, {}> {
	Validate_Early() {
		AssertValidate('UpdateMapDetails_payload', this.payload, 'Payload invalid');
	}

	oldData: Map;
	newData: Map;
	async Prepare() {
		const { mapID, mapUpdates } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'maps', mapID) as Map;
		this.newData = { ...this.oldData, ...mapUpdates };
		this.newData.editedAt = Date.now();
	}
	async Validate() {
		AssertValidate('Map', this.newData, 'New map-data invalid');
	}

	GetDBUpdates() {
		const { mapID, mapUpdates } = this.payload;
		const updates = {};
		updates[`maps/${mapID}`] = this.newData;
		return updates;
	}
}
