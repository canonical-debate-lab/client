import { configure, observable } from 'mobx';
import { types, unprotect, onSnapshot, flow, applySnapshot } from 'mobx-state-tree';
import makeInspectable from 'mobx-devtools-mst';
import { WaitXThenRun } from 'js-vextensions';
import { MainStateM } from './main';
import * as mapExports from './main/maps/$map';

// configure({ enforceActions: 'always' });
configure({ enforceActions: 'observed' });

/* export class StoreM {
	@observable main = new MainStateM();
}

export const storeM = new StoreM();
/* declare global { const storeM: StoreM; } *#/ G({ storeM }); */

// type GetPropsOfType<T, K extends keyof any> = Pick<T, Extract<keyof T, K>>;

const StoreM = types.model('StoreM', {
	main: MainStateM,
}).actions((self) => {
	// const mapActions = mapExports.VValues().filter(a => a instanceof Function && a['Watch'] != null);
	// const mapActions = Object.entries(mapExports).filter(a => a[1] instanceof Function && a[1]['Watch'] != null).ToMap(a => a[0], a => a[1]);
	/* const mapActions = E(mapExports);
	for (const pair of mapActions.Pairs()) {
		if (!(pair.value instanceof Function) || pair.value['isStoreAction'] == null) {
			delete mapActions[pair.key];
		}
	}

	/* const actions = {};
	mapActions.forEach(a => actions[a['displayName']] = a);
	return actions; *#/
	return {
		...mapActions,
	}; */
	return {
		/* afterCreate: flow(function* () {
			yield ;
			applySnapshot().testSnap = JSON.stringify(getSnapshot(self));
		}), */
	};
});

export let storeM: ReturnType<typeof InitStore>;

/* declare global { const storeM: StoreM; } */
export function InitStore() {
	const result = StoreM.create({
		main: {
			maps: {},
		},
	});
	// unprotect(result);
	makeInspectable(result);

	// listen to new snapshots
	/* onSnapshot(result, (snapshot) => {
		console.dir(snapshot);
	}); */

	storeM = result;
	G({ storeM: result });
	return result; // the only reason we return it is for the "ReturnType<...>" above
}
