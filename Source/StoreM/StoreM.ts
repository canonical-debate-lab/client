import { configure, observable } from 'mobx';
import { MainStateM } from './main';

// configure({ enforceActions: 'always' });
configure({ enforceActions: 'observed' });

export class StoreM {
	@observable main = new MainStateM();
}

export const storeM = new StoreM();
declare global { const storeM: StoreM; } G({ storeM });
