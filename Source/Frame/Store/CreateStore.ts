import { unstable_batchedUpdates } from 'react-dom';
import { applyMiddleware, compose, createStore, StoreEnhancer } from 'redux';
// import {version, firebaseConfig} from "../../BakedConfig";
// var {version, firebaseConfig} = require(PROD ? "../../BakedConfig_Prod" : "../../BakedConfig_Dev");
// import {batchedUpdatesMiddleware} from "redux-batched-updates";
import { batchedSubscribe } from 'redux-batched-subscribe';
import { routerForBrowser } from 'redux-little-router';
import { persistStore } from 'redux-persist';
import { FirebaseFirestore } from '@firebase/firestore-types';

/* eslint-disable */
import firebase_ from 'firebase';
import { reactReduxFirebase, firebaseReducer } from 'react-redux-firebase';
import { reduxFirestore, firestoreReducer } from 'redux-firestore';
import { MidDispatchAction, PostDispatchAction, PreDispatchAction } from './ActionProcessor';
import { MakeRootReducer } from '../../Store/index';
import { DBPath } from '../../Frame/Database/DatabaseHelpers';
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

declare global { var firestoreDB: FirebaseFirestore; } // set in CreateStore.ts

const dispatchInterceptors = [];
export function AddDispatchInterceptor(interceptor: Function) {
	dispatchInterceptors.push(interceptor);
}

export function CreateStore(initialState = {}, history) {
	// middleware configuration
	// ==========

	const outerMiddleware = [
		// routerMiddleware(browserHistory),
		store => next => (action) => {
			// PreDispatchAction(action); if (action.type == "ActionSet") for (let sub of action.payload.actions) PreDispatchAction(sub);
			const returnValue = next(action);
			// MidDispatchAction(action, returnValue); if (action.type == "ActionSet") for (let sub of action.payload.actions) MidDispatchAction(sub, returnValue);
			setTimeout(() => {
				PostDispatchAction(action); if (action.type == 'ActionSet') for (const sub of action.payload.actions) PostDispatchAction(sub);
			});
			return returnValue;
		},
		routerMiddleware,
	];
	const innerMiddleware = [
		store => next => (action) => {
			PreDispatchAction(action); if (action.type == 'ActionSet') for (const sub of action.payload.actions) PreDispatchAction(sub);
			const returnValue = next(action);
			MidDispatchAction(action, returnValue); if (action.type == 'ActionSet') for (const sub of action.payload.actions) MidDispatchAction(sub, returnValue);
			return returnValue;
		},
		store => next => (action) => {
			const actionStacks_actionTypeIgnorePatterns = [
				'@@reactReduxFirebase/', // ignore redux actions
			];
			if (g.actionStacks || (DEV && !actionStacks_actionTypeIgnorePatterns.Any(a => action.type.startsWith(a)))) {
				action['stack'] = new Error().stack.split('\n').slice(1); // add stack, so we can inspect in redux-devtools
			}
			for (const interceptor of dispatchInterceptors) {
				const result = interceptor(action);
				if (result == false) return;
			}

			const returnValue = next(action);
			return returnValue;
		},
	];

	// redux-dev-tools config
	// ==========

	const reduxDevToolsConfig = {
		maxAge: 70,
		// actionsBlacklist: ['ACTNotificationMessageAdd', 'ACTNotificationMessageRemove'],
		/* predicate: (state, action) => {
			return !['ACTNotificationMessageAdd', 'ACTNotificationMessageRemove'].Contains(action.type);
		}, */
	};

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
		// You can think of the earlier ones as "wrapping" and being able to "monitor the results of" the ones after it, but (usually) telling them "you apply first, then I will".
		// So put your middleware earlier in this list if you want it to monitor another middleware's *results*. And put it after if you want it to be able to *intercept* its actions and such.
		compose(...[
			// autoRehydrate({log: true}),
			routerEnhancer,
			applyMiddleware(...outerMiddleware),
			reactReduxFirebase(firebase, reduxFirebaseConfig),
			reduxFirestore(firebase, {}),
			batchedSubscribe(unstable_batchedUpdates),
			applyMiddleware(...innerMiddleware), // place inner-middleware after reduxFirebase (deeper to func that *actually dispatches*), so it can intercept all its dispatched events
			g.devToolsExtension && g.devToolsExtension(reduxDevToolsConfig),
		].filter(a => a)) as StoreEnhancer<any>,
	) as ProjectStore;
	// SetUpPostDispatchAction(store);
	store.reducer = rootReducer;

	/* function Dispatch_WithStack(action) {
		if (g.actionStacks || (DEV && !actionStacks_actionTypeIgnorePatterns.Any(a => action.type.startsWith(a)))) {
			action['stack'] = new Error().stack.split('\n').slice(1); // add stack, so we can inspect in redux-devtools
		}
		for (let interceptor of dispatchInterceptors) {
			let result = interceptor(action);
			if (result == false) return;
		}
		store['dispatch_orig'](action);
	}
	if (store.dispatch != Dispatch_WithStack) {
		store['dispatch_orig'] = store.dispatch;
		store.dispatch = Dispatch_WithStack as any;
	}
	const actionStacks_actionTypeIgnorePatterns = [
		'@@reactReduxFirebase/', // ignore redux actions
	]; */

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
