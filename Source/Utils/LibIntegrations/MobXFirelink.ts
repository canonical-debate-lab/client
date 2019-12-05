import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { dbVersion } from 'Main';
import { FirebaseDBShape } from 'Store/firebase';

export const fire = new Firelink<FirebaseDBShape>(dbVersion, DB_SHORT);
// export const { GetDocs, GetDoc, GetDocs_Async, GetDoc_Async, GetAsync, WithStore } = fire;
SetDefaultFireOptions({ fire });

declare module 'mobx-firelink/Dist/DBShape' {
	interface DBShape extends FirebaseDBShape {}
}
