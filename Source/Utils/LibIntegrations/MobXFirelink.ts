import 'mobx'; // import mobx before we declare the module below, otherwise vscode auto-importer gets confused at path to mobx
import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { dbVersion } from 'Main';
import { FirebaseDBShape } from 'Store/firebase';
import { store, RootState } from 'Store';
import { OnPopulated } from 'vwebapp-framework';

declare module 'mobx-firelink/Dist/UserTypes' {
	interface RootStoreShape extends RootState {}
	interface DBShape extends FirebaseDBShape {}
}

const linkRootPath = `versions/v${dbVersion}-${DB_SHORT}`;
export const fire = new Firelink<RootState, FirebaseDBShape>(linkRootPath, store, false);
store.firelink = fire;
SetDefaultFireOptions({ fire });
// console.log('Default fire options set:', { fire });
OnPopulated(() => fire.InitSubs());

// start auto-runs after store+firelink are created
require('Utils/AutoRuns');
