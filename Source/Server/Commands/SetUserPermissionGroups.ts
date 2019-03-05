import { AssertValidate } from 'Server/Server';
import {PermissionGroupSet} from 'Store/firebase/userExtras/@UserExtraInfo';
import { Command } from '../Command';
import { UserEdit } from '../CommandMacros';

AddSchema({
	properties: {
		userID: { type: 'string' },
		permissionGroups: { $ref: 'PermissionGroupSet' },
	},
	required: ['userID', 'permissionGroups'],
}, 'SetUserPermissionGroups_payload');

@UserEdit
export class SetUserPermissionGroups extends Command<{userID: string, permissionGroups: PermissionGroupSet}, {}> {
	Validate_Early() {
		AssertValidate('SetUserPermissionGroups_payload', this.payload, 'Payload invalid');
	}

	async Prepare() {}
	async Validate() {}

	GetDBUpdates() {
		const { userID, permissionGroups } = this.payload;
		const updates = {};
		updates[`userExtras/${userID}/.permissionGroups`] = permissionGroups;
		return updates;
	}
}
