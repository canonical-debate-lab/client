export class UserExtraInfo {
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
		joinDate: { type: 'number' },
		permissionGroups: { $ref: 'PermissionGroupSet' },

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
AddSchema({
	properties: {
		basic: { type: 'boolean' },
		verified: { type: 'boolean' },
		mod: { type: 'boolean' },
		admin: { type: 'boolean' },
	},
}, 'PermissionGroupSet');
