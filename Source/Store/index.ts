import { configure } from 'mobx';
import { O } from 'Utils/FrameworkOverrides';
import { ignore } from 'mobx-sync';
import { Firelink } from 'mobx-firelink';
import { immerable } from 'immer';
import { MainState } from './main';
import { FirebaseDBShape } from './firebase';

// configure({ enforceActions: 'always' });
configure({ enforceActions: 'observed' });

export class RootState {
	[immerable] = true; // makes the store able to be used in immer's "produce" function

	@O main = new MainState();

	// @O forum: any;
	@O feedback: any;

	/* @O @ignore firebase: any;
	@O @ignore firestore: any; */
	@O @ignore firelink: Firelink<RootState, FirebaseDBShape>;

	@O @ignore router: any;
	// @O @ignore vMenu: VMenuState;
}

export const store = new RootState();
G({ store });
