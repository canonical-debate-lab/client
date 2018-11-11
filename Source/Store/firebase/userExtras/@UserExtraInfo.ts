import { GetUserPermissions, GetUserID } from '../users';

export default class UserExtraInfo {
	constructor(initialData: Partial<UserExtraInfo>) {
		this.Extend(initialData);
	}
	joinDate: number;
	permissionGroups: PermissionGroupSet;

	edits: number;
	lastEditAt: number;
}
AddSchema({
	properties: {
		edits: { type: 'number' },
		lastEditAt: { type: 'number' },
	},
}, 'UserExtraInfo');

export class PermissionGroupSet {
	basic: boolean;
	verified: boolean; // todo: probably remove
	mod: boolean;
	admin: boolean;
}
