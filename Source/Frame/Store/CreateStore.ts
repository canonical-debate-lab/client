import { unstable_batchedUpdates } from 'react-dom';
import { applyMiddleware, compose, createStore, StoreEnhancer } from 'redux';
// import {version, firebaseConfig} from "../../BakedConfig";
// var {version, firebaseConfig} = require(PROD ? "../../BakedConfig_Prod" : "../../BakedConfig_Dev");
// import {batchedUpdatesMiddleware} from "redux-batched-updates";
import { batchedSubscribe } from 'redux-batched-subscribe';
import { routerForBrowser } from 'redux-little-router';
import { persistStore } from 'redux-persist';
import { DBPath } from '../../Frame/Database/DatabaseHelpers';
import { MakeRootReducer } from '../../Store/index';
import { MidDispatchAction, PostDispatchAction, PreDispatchAction } from './ActionProcessor';

/* eslint-disable */
import firebase_ from 'firebase';
import { reactReduxFirebase, firebaseReducer } from 'react-redux-firebase';
import { reduxFirestore, firestoreReducer } from 'redux-firestore';
import 'firebase/firestore';
const firebase = firebase_ as any;
/* eslint-enable */

const routes = {
	'/': {},
	'/:seg': {},
	'/:seg/:seg': {},
	'/:seg/:seg/:seg': {},
	'/:seg/:seg/:seg/:seg': {},
	'/:seg/:seg/:seg/:seg/:seg': {},
};
const { reducer: routerReducer, middleware: routerMiddleware, enhancer: routerEnhancer } = routerForBrowser({
	routes,
});

declare global { var firestoreDB: any; } // set in CreateStore.ts

export function CreateStore(initialState = {}, history) {
	// Window Vars Config
	// ==========

	g.version = version;

	// Middleware Configuration
	// ==========
	const middleware = [
		routerMiddleware,
	];
	const lateMiddleware = [
		// for some reason, this breaks stuff if we have it the last one
		store => next => (action) => {
			PreDispatchAction(action); if (action.type == 'ApplyActionSet') for (const sub of action.actions) PreDispatchAction(sub);
			const returnValue = next(action);
			MidDispatchAction(action, returnValue); if (action.type == 'ApplyActionSet') for (const sub of action.actions) MidDispatchAction(sub, returnValue);
			WaitXThenRun(0, () => {
				PostDispatchAction(action); if (action.type == 'ApplyActionSet') for (const sub of action.actions) PostDispatchAction(sub);
			});
			return returnValue;
		},
	];

	// redux-dev-tools config
	// ==========

	const reduxDevToolsConfig = { maxAge: 70 };

	// Store Instantiation and HMR Setup
	// ==========

	// reduxConfig["userProfile"] = DBPath("users"); // root that user profiles are written to
	const reduxFirebaseConfig = {
		userProfile: DBPath('users'), // root that user profiles are written to
		enableLogging: false, // enable/disable Firebase Database Logging
		updateProfileOnLogin: false, // enable/disable updating of profile on login
		// profileDecorator: (userData) => ({ email: userData.email }) // customize format of user profile
		useFirestoreForProfile: true,
		preserveOnLogout: [DBPath()],
	};
	if (firebase.apps.length == 0) {
		firebase.initializeApp(firebaseConfig);
	}
	g.firestoreDB = firebase.firestore(); // can also use store.firebase.firestore()
	firestoreDB.settings({ timestampsInSnapshots: true });

	const extraReducers = {
		router: routerReducer,
	};
	const rootReducer = MakeRootReducer(extraReducers);
	const store = createStore(
		rootReducer,
		initialState,
		// Note: Compose applies functions from right to left: compose(f, g, h) = (...args)=>f(g(h(...args))).
		// You can think of the earlier ones as "wrapping" and being able to "monitor" the ones after it, but (usually) telling them "you apply first, then I will".
		compose(...[
			// autoRehydrate({log: true}),
			routerEnhancer,
			applyMiddleware(...middleware),
			reactReduxFirebase(firebase, reduxFirebaseConfig),
			reduxFirestore(firebase, {}),
			batchedSubscribe(unstable_batchedUpdates),
			applyMiddleware(...lateMiddleware), // place late-middleware after reduxFirebase, so it can intercept all its dispatched events
			g.devToolsExtension && g.devToolsExtension(reduxDevToolsConfig),
		].filter(a => a)) as StoreEnhancer<any>,
	) as ProjectStore;
	store.reducer = rootReducer;

	function Dispatch_WithStack(action) {
		if (g.actionStacks || (DEV && !actionStacks_actionTypeIgnorePatterns.Any(a => action.type.startsWith(a)))) {
			action['stack'] = new Error().stack.split('\n').slice(1); // add stack, so we can inspect in redux-devtools
		}
		store['dispatch_orig'](action);
	}
	if (store.dispatch != Dispatch_WithStack) {
		store['dispatch_orig'] = store.dispatch;
		store.dispatch = Dispatch_WithStack as any;
	}
	const actionStacks_actionTypeIgnorePatterns = [
		'@@reactReduxFirebase/', // ignore redux actions
	];

	/* let w = watch(()=>State());
	store.subscribe(w((newVal, oldVal) => {
		ProcessAction(g.lastAction, newVal, oldVal);
	})); */

	// begin periodically persisting the store
	// let persister = persistStore(store, {whitelist: ["main"]});
	// you want to remove some keys before you save
	// let persister = persistStore(store, null, ()=>g.storeRehydrated = true);
	const persister = persistStore(store);
	if (startURL.GetQueryVar('clearState')) {
		Log("Clearing redux-store's state and local-storage...");
		ClearLocalData(persister);
	}

	if (DEV) {
		if (module.hot) {
			module.hot.accept('../../Store', () => {
				const { MakeRootReducer } = require('../../Store');
				store.reducer = MakeRootReducer(extraReducers);
				store.replaceReducer(store.reducer);
			});
		}
	}

	return { store, persister };
}

export function ClearLocalData(persister) {
	persister.purge();
	// localStorage.clear();
	for (const key in localStorage) {
		if (key.startsWith('firebase:')) continue; // keep auth-info
		delete localStorage[key];
	}
}
