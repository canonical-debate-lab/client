import { Store } from 'redux';
import ReactDOM from 'react-dom';
// import React from "react/lib/ReactWithAddons";
import { Persister } from 'redux-persist/src/types';
import { JustBeforeUI_listeners, JustBeforeInitLibs_listeners } from 'Main';
import { CreateStore, FirebaseApp, Action } from 'Utils/FrameworkOverrides';
import { RootState } from './Store/index';

// uncomment this if you want to load the source-maps and such ahead of time (making-so the first actual call can get it synchronously)
// StackTrace.get();

JustBeforeInitLibs_listeners.forEach(a => a());
require('./InitLibs').InitLibs();

// just declare store; we set it in RootUIWrapper.ComponentWillMount
declare global {
	type ProjectStore = Store<RootState> & {firebase: FirebaseApp, firestore: any, reducer: (state: RootState, action: Action<any>)=>RootState};
	var store: ProjectStore;
	var persister: Persister;
	var firestoreDB: any; // set in CreateStore.ts
}

JustBeforeUI_listeners.forEach(a => a());
const mountNode = document.getElementById('root');
const { RootUIWrapper } = require('./UI/Root');

ReactDOM.render(<RootUIWrapper/>, mountNode);
