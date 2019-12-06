import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { dbVersion, firebaseConfig } from 'Main';
import { FirebaseDBShape } from 'Store/firebase';
import firebase from 'firebase/app';
import { store } from 'Store';

// if first run (in firebase-mock/test, or not hot-reloading), initialize the firebase app/sdk
// if (!firebaseAppIsReal || firebaseApp.apps.length == 0) {
firebase.initializeApp(firebaseConfig);

export const fire = new Firelink<FirebaseDBShape>(dbVersion, DB_SHORT);
// export const { GetDocs, GetDoc, GetDoc_Async, GetAsync, WithStore } = fire;
SetDefaultFireOptions({ fire });

store.firelink = fire;

declare module 'mobx-firelink/Dist/DBShape' {
	interface DBShape extends FirebaseDBShape {}
}
