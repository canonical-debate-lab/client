import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { FirebaseState } from 'Store/firebase';
import { dbVersion } from 'Main';

export const fire = new Firelink<FirebaseState>(dbVersion, DB_SHORT);
// export const { GetDocs, GetDoc, GetDocs_Async, GetDoc_Async, GetAsync, WithStore } = fire;
SetDefaultFireOptions({ fire });

declare module 'mobx-firelink/Dist/Store' {
	interface DBDataStore extends FirebaseState {}
}
