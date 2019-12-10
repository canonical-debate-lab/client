import { Firelink, GetDoc, SetDefaultFireOptions } from 'mobx-firelink';
import { dbVersion, firebaseConfig } from 'Main';
import { FirebaseDBShape } from 'Store/firebase';
import firebase from 'firebase/app';
import { store, RootState } from 'Store';

declare module 'mobx-firelink/Dist/UserTypes' {
	interface RootStoreShape extends RootState {}
	interface DBShape extends FirebaseDBShape {}
}

// if first run (in firebase-mock/test, or not hot-reloading), initialize the firebase app/sdk
// if (!firebaseAppIsReal || firebaseApp.apps.length == 0) {
firebase.initializeApp(firebaseConfig);

export const fire = new Firelink<RootState, FirebaseDBShape>(dbVersion, DB_SHORT, store);
// export const { GetDocs, GetDoc, GetDoc_Async, GetAsync, WithStore } = fire;
SetDefaultFireOptions({ fire });

store.firelink = fire;

// start auto-runs after store+firelink are created
require('Utils/AutoRuns');
