import firebase_ from 'firebase';
import { firebaseConfig } from 'Main';
import { applyMiddleware, compose, createStore, StoreEnhancer, Store } from 'redux';
import { routerForBrowser } from 'redux-little-router';
import { PostDispatchAction, PreDispatchAction } from 'Store/ActionProcessor';
import { MakeRootReducer, RootState } from 'Store/index';
import { Action } from './Action'; // eslint-disable-line

const firebase = firebase_ as any;

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

export function ClearLocalData(persister) {
	persister.purge();
	// localStorage.clear();
	Object.keys(window.localStorage).forEach((key) => {
		if (key.startsWith('firebase:')) return; // keep auth-info
		delete window.localStorage[key];
	});
}


export function CreateStore(initialState = {}) {
	// Middleware Configuration
	// ==========
	const middleware = [
		routerMiddleware,
	];
	const lateMiddleware = [
		// for some reason, this breaks stuff if we have it the last one
		() => next => (action) => {
			PreDispatchAction(action);
			const returnValue = next(action);
			// MidDispatchAction(action, returnValue);
			WaitXThenRun(0, () => {
				PostDispatchAction(action);
			});
			return returnValue;
		},
	];

	// redux-dev-tools config
	// ==========

	const reduxDevToolsConfig = {
		maxAge: 70,
	};

	// Store Instantiation and HMR Setup
	// ==========

	/* const reduxFirebaseConfig = {
		userProfile: DBPath('users'), // root that user profiles are written to
		enableLogging: false, // enable/disable Firebase Database Logging
		updateProfileOnLogin: false, // enable/disable updating of profile on login
		// profileDecorator: (userData) => ({ email: userData.email }) // customize format of user profile
		// useFirestoreForProfile: true, // for now, use firebase
		preserveOnLogout: [DBPath()],
	}; */
	if (firebase.apps.length === 0) {
		firebase.initializeApp(firebaseConfig);
	}
	// g.firestoreDB = firebase.firestore(); // can also use store.firebase.firestore()

	const extraReducers = {
		router: routerReducer,
	};
	const rootReducer = MakeRootReducer(extraReducers);
	const store = createStore(
		rootReducer,
		initialState,
		// Note: Compose applies functions from right to left: compose(f, g, h) = (...args)=>f(g(h(...args))).
		// You can think of the earlier ones as 'wrapping' and being able to 'monitor' the ones after it, but (usually) telling them 'you apply first, then I will'.
		compose(...[
			// autoRehydrate({log: true}),
			routerEnhancer,
			applyMiddleware(...middleware),
			// reactReduxFirebase(firebase, reduxFirebaseConfig),
			// batchedSubscribe(unstable_batchedUpdates),
			applyMiddleware(...lateMiddleware), // place late-middleware after reduxFirebase, so it can intercept all its dispatched events
			window['devToolsExtension'] && window['devToolsExtension'](reduxDevToolsConfig),
		].filter(a => a)) as StoreEnhancer<any>,
	) as ProjectStore;
	store.reducer = rootReducer;

	/* let w = watch(()=>State());
	store.subscribe(w((newVal, oldVal) => {
		ProcessAction(g.lastAction, newVal, oldVal);
	})); */

	// begin periodically persisting the store
	// let persister = persistStore(store, {whitelist: ['main']});
	// you want to remove some keys before you save
	// let persister = persistStore(store, null, ()=>g.storeRehydrated = true);
	const persister = persistStore(store);
	if (startURL.GetQueryVar('clearState')) {
		Log('Clearing redux-store\'s state and local-storage...');
		ClearLocalData(persister);
	}

	if (DEV) {
		if (module.hot) {
			module.hot.accept('../../Store', () => {
				const MakeRootReducer_new = require('Store').MakeRootReducer; // eslint-disable-line global-require
				store.reducer = MakeRootReducer_new(extraReducers);
				store.replaceReducer(store.reducer);
			});
		}
	}

	return { store, persister };
}
