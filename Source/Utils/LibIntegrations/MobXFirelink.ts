import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { dbVersion } from 'Main';
import { FirebaseDBShape } from 'Store/firebase';
import { store, RootState } from 'Store';
import { OnPopulated } from 'vwebapp-framework/Source';

declare module 'mobx-firelink/Dist/UserTypes' {
	interface RootStoreShape extends RootState {}
	interface DBShape extends FirebaseDBShape {}
}

const linkRootPath = `versions/v${dbVersion}-${DB_SHORT}`;
export const fire = new Firelink<RootState, FirebaseDBShape>(linkRootPath, store, false);
store.firelink = fire;
SetDefaultFireOptions({ fire });
OnPopulated(() => fire.InitSubs());

// start auto-runs after store+firelink are created
require('Utils/AutoRuns');
