import { configure } from 'mobx';
import { O } from 'Utils/FrameworkOverrides';
import { ignore } from 'mobx-sync';
import { Firelink } from 'mobx-firelink';
import { immerable } from 'immer';
import { Feedback_RootState } from 'firebase-feedback';
import { MainState } from './main';
import { FirebaseDBShape } from './firebase';

// configure({ enforceActions: 'always' });
configure({ enforceActions: 'observed' });

export class RootState {
	// [immerable] = true; // makes the store able to be used in immer's "produce" function

	@O main = new MainState();

	// @O forum: any;
	// @O feedback: Feedback_RootState;
	// @O.ref feedback = new Feedback_RootState(); // needed due to details of how mobx/immer work -- will probably make unneeded later
	@O.ref feedback: Feedback_RootState; // O.ref needed due to details of how mobx/immer work -- will probably make unneeded later

	/* @O @ignore firebase: any;
	@O @ignore firestore: any; */
	@O @ignore firelink: Firelink<RootState, FirebaseDBShape>;

	@O @ignore router: any;
	// @O @ignore vMenu: VMenuState;
}

export const store = new RootState();
G({ store });
