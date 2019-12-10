import { CachedTransform, Assert } from 'js-vextensions';
import { User } from 'Store/firebase/users/@User';
import { presetBackgrounds, defaultPresetBackground, BackgroundConfig } from 'Utils/UI/PresetBackgrounds';
import { GADDemo } from 'UI/@GAD/GAD';
import { GetAuth } from 'Store/firebase';
import { IsAuthValid, GetDoc, GetDocs, StoreAccessor } from 'mobx-firelink';
import { AccessLevel } from './nodes/@MapNode';
import { UserExtraInfo, PermissionGroupSet } from './userExtras/@UserExtraInfo';

/* export function GetAuth(state: RootState) {
	return state.firebase.auth;
} */
export const MeID = StoreAccessor((s) => (): string => {
	// return state.firebase.data.auth ? state.firebase.data.auth.uid : null;
	// return GetData(state.firebase, "auth");
	/* var result = helpers.pathToJS(firebase, "auth").uid;
	return result; */
	/* let firebaseSet = State().firebase as Set<any>;
	return firebaseSet.toJS().auth.uid; */
	// return State(a=>a.firebase.auth) ? State(a=>a.firebase.auth.uid) : null;
	return IsAuthValid(GetAuth()) ? GetAuth().id : null;
});
export const Me = StoreAccessor((s) => () => {
	return GetUser(MeID());
});

export const GetUser = StoreAccessor((s) => (userID: string): User => {
	return GetDoc({}, (a) => a.users.get(userID));
});
export const GetUsers = StoreAccessor((s) => (): User[] => {
	return GetDocs({}, (a) => a.users);
});

/* export type UserExtraInfoMap = { [key: string]: UserExtraInfo };
export const GetUserExtraInfoMap = StoreAccessor((s) => (): UserExtraInfoMap => {
	return GetDocs((a) => a.userExtras);
}); */
export const GetUserExtraInfo = StoreAccessor((s) => (userID: string): UserExtraInfo => {
	return GetDoc({}, (a) => a.userExtras.get(userID));
});
export const GetUserJoinDate = StoreAccessor((s) => (userID: string): number => {
	return GetDoc({}, (a) => a.userExtras.get(userID))?.joinDate;
});
const defaultPermissions = { basic: true, verified: true, mod: false, admin: false } as PermissionGroupSet; // temp
export const GetUserPermissionGroups = StoreAccessor((s) => (userID: string): PermissionGroupSet => {
	if (userID == null) return null;
	return GetDoc({}, (a) => a.userExtras.get(userID))?.permissionGroups ?? defaultPermissions;
});
export function GetUserAccessLevel(userID: string) {
	const groups = GetUserPermissionGroups(userID);
	if (groups == null) return AccessLevel.Basic;

	if (groups.admin) return AccessLevel.Admin;
	if (groups.mod) return AccessLevel.Mod;
	if (groups.verified) return AccessLevel.Verified;
	// if (groups.basic) return AccessLevel.Basic;
	Assert(false);
}

export function GetUserBackground(userID: string): BackgroundConfig {
	if (GADDemo) return { color: '#ffffff' };

	const user = GetUser(userID);
	if (!user) return presetBackgrounds[defaultPresetBackground];

	if (user.backgroundCustom_enabled) {
		return {
			color: user.backgroundCustom_color,
			url_1920: user.backgroundCustom_url,
			url_3840: user.backgroundCustom_url,
			url_max: user.backgroundCustom_url,
			position: user.backgroundCustom_position || 'center center',
		};
	}

	const background = presetBackgrounds[user.backgroundID] || presetBackgrounds[defaultPresetBackground];
	return background;
}
