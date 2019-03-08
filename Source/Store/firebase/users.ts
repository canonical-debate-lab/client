import { CachedTransform } from 'js-vextensions';
import { User } from 'Store/firebase/users/@User';
import { presetBackgrounds } from 'Utils/UI/PresetBackgrounds';
import { GetData } from 'Utils/FrameworkOverrides';
import { GetAuth, IsAuthValid } from '../firebase';
import { AccessLevel } from './nodes/@MapNode';
import { UserExtraInfo, PermissionGroupSet } from './userExtras/@UserExtraInfo';

/* export function GetAuth(state: RootState) {
	return state.firebase.auth;
} */
export function MeID(): string {
	// return state.firebase.data.auth ? state.firebase.data.auth.uid : null;
	// return GetData(state.firebase, "auth");
	/* var result = helpers.pathToJS(firebase, "auth").uid;
	return result; */
	/* let firebaseSet = State().firebase as Set<any>;
	return firebaseSet.toJS().auth.uid; */
	// return State(a=>a.firebase.auth) ? State(a=>a.firebase.auth.uid) : null;
	return IsAuthValid(GetAuth()) ? GetAuth().uid : null;
}
export function Me() {
	return GetUser(MeID());
}

export function GetUser(userID: string): User {
	if (userID == null) return null;
	return GetData('users', userID);
}
export function GetUsers(): User[] {
	const userMap = GetData({ collection: true }, 'users');
	return CachedTransform('GetUsers', [], userMap, () => (userMap ? userMap.VValues(true) : []));
}

export type UserExtraInfoMap = { [key: string]: UserExtraInfo };
export function GetUserExtraInfoMap(): UserExtraInfoMap {
	return GetData({ collection: true }, 'userExtras');
}
export function GetUserJoinDate(userID: string): number {
	if (userID == null) return null;
	return GetData('userExtras', userID, '.joinDate');
}
const defaultPermissions = { basic: true, verified: true, mod: false, admin: false } as PermissionGroupSet; // temp
export function GetUserPermissionGroups(userID: string): PermissionGroupSet {
	if (userID == null) return null;
	return GetData('userExtras', userID, '.permissionGroups') || defaultPermissions;
}
export function GetUserAccessLevel(userID: string) {
	const groups = GetUserPermissionGroups(userID);
	if (groups == null) return AccessLevel.Basic;

	if (groups.admin) return AccessLevel.Admin;
	if (groups.mod) return AccessLevel.Mod;
	if (groups.verified) return AccessLevel.Verified;
	// if (groups.basic) return AccessLevel.Basic;
	Assert(false);
}

export function GetUserBackground(userID: string) {
	const user = GetUser(userID);
	if (!user) return presetBackgrounds[1];

	if (user.backgroundCustom_enabled) {
		return {
			color: user.backgroundCustom_color,
			url_1920: user.backgroundCustom_url,
			url_3840: user.backgroundCustom_url,
			position: user.backgroundCustom_position || 'center center',
		};
	}

	const background = presetBackgrounds[user.backgroundID] || presetBackgrounds[1];
	return background;
}
