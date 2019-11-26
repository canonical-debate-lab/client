import { PermissionGroupSet } from 'Store/firebase/userExtras/@UserExtraInfo';
import { AddSchema, AssertValidate } from 'Utils/FrameworkOverrides';
import {Command} from 'mobx-firelink';
import { UserEdit } from '../CommandMacros';

AddSchema('SetUserPermissionGroups_payload', {
	properties: {
		userID: { type: 'string' },
		permissionGroups: { $ref: 'PermissionGroupSet' },
	},
	required: ['userID', 'permissionGroups'],
});

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
