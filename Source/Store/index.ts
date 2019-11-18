import { configure } from 'mobx';
import { VMenuState } from 'react-vmenu';
import { O } from 'Utils/FrameworkOverrides';
import { ignore } from 'mobx-sync';
import { MainState } from './main';

// configure({ enforceActions: 'always' });
configure({ enforceActions: 'observed' });

export class RootState {
	@O main: MainState;

	// @O forum: any;
	@O feedback: any;

	@O @ignore firebase: any;
	@O @ignore firestore: any;
	@O @ignore router: any;
	@O @ignore vMenu: VMenuState;
}

export const store = new RootState();
G({ store });
