import { MapNodePhrasing } from 'Store_Old/firebase/nodePhrasings/@MapNodePhrasing';
import { AddSchema, GetSchemaJSON, Schema, AssertValidate, GetDataAsync, Command } from 'Utils/FrameworkOverrides';
import { UserEdit } from 'Server/CommandMacros';

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
		this.oldData = await GetDataAsync({ addHelpers: false }, 'nodePhrasings', id) as MainType;
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
