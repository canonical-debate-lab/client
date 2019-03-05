import { Subforum, Post, Thread } from 'firebase-forum';
import { PermissionGroupSet } from './userExtras/@UserExtraInfo';
import { MapNode } from './nodes/@MapNode';
import { GetUserPermissionGroups, MeID } from './users';
import { Term } from './terms/@Term';
import { Image } from './images/@Image';
import { Map } from './maps/@Map';

// selectors
// ==========

export function CanGetBasicPermissions(userIDOrPermissions: string | PermissionGroupSet) {
	if (true) return HasModPermissions(userIDOrPermissions); // temp; will be removed once GAD is over

	/* const permissions = IsString(userIDOrPermissions) ? GetUserPermissions(userIDOrPermissions) : userIDOrPermissions;
	return permissions == null || permissions.basic; // if anon/not-logged-in, assume user can get basic permissions once logged in */
}
export function HasBasicPermissions(userIDOrPermissions: string | PermissionGroupSet) {
	if (true) return HasModPermissions(userIDOrPermissions); // temp; will be removed once GAD is over

	/* const permissions = IsString(userIDOrPermissions) ? GetUserPermissions(userIDOrPermissions) : userIDOrPermissions;
	return permissions ? permissions.basic : false; */
}
export function HasModPermissions(userIDOrPermissions: string | PermissionGroupSet) {
	const permissions = IsString(userIDOrPermissions) ? GetUserPermissionGroups(userIDOrPermissions) : userIDOrPermissions;
	return permissions ? permissions.mod : false;
}
export function HasAdminPermissions(userIDOrPermissions: string | PermissionGroupSet) {
	const permissions = IsString(userIDOrPermissions) ? GetUserPermissionGroups(userIDOrPermissions) : userIDOrPermissions;
	return permissions ? permissions.admin : false;
}
/** If user is the creator, also requires that they (still) have basic permissions. */
export function IsUserCreatorOrMod(userID: string, entity: Term | Image | Map | MapNode | Post | Thread) {
	return (entity && entity.creator === userID && HasBasicPermissions(userID)) || HasModPermissions(userID);
}
