import { Store } from 'redux';
import ReactDOM from 'react-dom';
// import React from "react/lib/ReactWithAddons";
import { Persister } from 'redux-persist/src/types';
import { JustBeforeUI_listeners, JustBeforeInitLibs_listeners } from 'Main';
import 'Utils/Graphs/ChartPlugins/@index';
import { CreateStore, FirebaseApp, Action } from 'Utils/FrameworkOverrides';
import { RootState } from './Store/index';

// uncomment this if you want to load the source-maps and such ahead of time (making-so the first actual call can get it synchronously)
// StackTrace.get();

// temp
/* let oldReplace = require("redux-little-router").replace;
require("redux-little-router").replace = function() {
	Log("Test:" + arguments[0], true);
	return oldReplace.apply(this, arguments);
}
let oldPush = require("redux-little-router").push;
require("redux-little-router").push = function() {
	Log("Test2:" + arguments[0], true);
	return oldPush.apply(this, arguments);
} */

JustBeforeInitLibs_listeners.forEach(a => a());
require('./InitLibs').InitLibs();

const { store: store_, persister } = CreateStore(g.__InitialState__);
declare global {
	type ProjectStore = Store<RootState> & {firebase: FirebaseApp, firestore: any, reducer: (state: RootState, action: Action<any>)=>RootState};
	var store: ProjectStore;
} G({ store: store_ });
declare global { var persister: Persister; } G({ persister });

const firestoreDB = store.firebase['firestore']();
G({ firestoreDB }); declare global { var firestoreDB: any; } // set in CreateStore.ts

JustBeforeUI_listeners.forEach(a => a());
const mountNode = document.getElementById('root');
const { RootUIWrapper } = require('./UI/Root');

ReactDOM.render(<RootUIWrapper store={store}/>, mountNode);
