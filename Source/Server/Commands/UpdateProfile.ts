import { AddSchema, AssertValidate, Command, GetDataAsync, GetSchemaJSON, Schema } from 'Utils/FrameworkOverrides';
import { User } from '../../Store_Old/firebase/users/@User';

type MainType = User;
const MTName = 'User';

AddSchema(`Update${MTName}_payload`, [MTName], () => ({
	properties: {
		id: { type: 'string' },
		updates: Schema({
			properties: GetSchemaJSON(MTName)['properties'].Including(
				'displayName', 'backgroundID',
				'backgroundCustom_enabled', 'backgroundCustom_color', 'backgroundCustom_url', 'backgroundCustom_position',
			),
		}),
	},
	required: ['id', 'updates'],
}));

export class UpdateProfile extends Command<{id: string, updates: Partial<MainType>}, {}> {
	Validate_Early() {
		AssertValidate(`Update${MTName}_payload`, this.payload, 'Payload invalid');
	}

	oldData: MainType;
	newData: MainType;
	async Prepare() {
		const { id, updates } = this.payload;
		this.oldData = await GetDataAsync({ addHelpers: false }, 'users', id) as MainType;
		this.newData = { ...this.oldData, ...updates };
	}
	async Validate() {
		AssertValidate(MTName, this.newData, `New ${MTName.toLowerCase()}-data invalid`);
	}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {};
		updates[`users/${id}`] = this.newData;
		return updates;
	}
}
