import { MapEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate, Schema } from 'Utils/FrameworkOverrides';
import { Command, GetAsync } from 'mobx-firelink';
import { GetMap } from 'Store/firebase/maps';
import { Map, Map_namePattern } from '../../Store/firebase/maps/@Map';
import { UserEdit } from '../CommandMacros';

AddSchema('UpdateMapDetails_payload', {
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
});

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
		this.oldData = await GetAsync(() => GetMap(mapID));
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
