import { autorun } from 'mobx';
import { store } from 'Store';
import { GetDataAsync, DBPath } from 'Utils/FrameworkOverrides';

let lastAuth;
autorun(() => {
	const auth = store.firebase.auth;
	if (auth != lastAuth) {
		lastAuth = auth;
		const userID = auth.uid;
		RunSignUpInitIfNotYetRun(userID);
	}
}, { name: 'UserSignUpHelper' });

async function RunSignUpInitIfNotYetRun(userID: string) {
	const joinDate = await GetDataAsync('userExtras', userID, '.joinDate');
	if (joinDate == null) {
		// todo: improve this; perhaps create an InitUser command, with the server doing the actual permission setting and such
		/* const firebase = store.firebase.helpers;
		firebase.ref(DBPath(`userExtras/${userID}`)).update({
			permissionGroups: { basic: true, verified: true, mod: false, admin: false },
			joinDate: Date.now(),
		}); */
		firestoreDB.doc(DBPath(`userExtras/${userID}`)).set({
			permissionGroups: { basic: true, verified: true, mod: false, admin: false },
			joinDate: Date.now(),
		}, { merge: true });
	}

	// Raven.setUserContext(action["auth"].Including("uid", "displayName", "email"));
}
