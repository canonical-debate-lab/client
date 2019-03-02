import { WaitTillSchemaAddedThenRun, AssertValidate } from 'Server/Server';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { User } from '../../Store/firebase/users/@User';
import { Command } from '../Command';
import { GetSchemaJSON } from '../Server';

type MainType = User;
const MTName = 'User';

WaitTillSchemaAddedThenRun(MTName, () => {
	AddSchema({
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
	}, `Update${MTName}_payload`);
});

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
