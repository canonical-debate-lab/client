import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { AddSchema, GetSchemaJSON, Schema, AssertValidate } from 'vwebapp-framework';
import { UserEdit } from 'Server/CommandMacros';
import { Command, GetAsync } from 'mobx-firelink';
import { GetNodePhrasings, GetNodePhrasing } from 'Store/firebase/nodePhrasings';

type MainType = MapNodePhrasing;
const MTName = 'MapNodePhrasing';

AddSchema(`Update${MTName}_payload`, [MTName], () => ({
	properties: {
		id: { type: 'string' },
		updates: Schema({
			properties: GetSchemaJSON(MTName).properties.Including('type', 'text', 'description'),
		}),
	},
	required: ['id', 'updates'],
}));

@UserEdit
export class UpdatePhrasing extends Command<{id: string, updates: Partial<MainType>}> {
	Validate_Early() {
		AssertValidate(`Update${MTName}_payload`, this.payload, 'Payload invalid');
	}

	oldData: MainType;
	newData: MainType;
	async Prepare() {
		const { id, updates } = this.payload;
		this.oldData = await GetAsync(() => GetNodePhrasing(id));
		this.newData = { ...this.oldData, ...updates };
	}
	async Validate() {
		AssertValidate(MTName, this.newData, `New ${MTName.toLowerCase()}-data invalid`);
	}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {};
		updates[`nodePhrasings/${id}`] = this.newData;
		return updates;
	}
}
