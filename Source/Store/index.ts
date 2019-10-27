import { firebaseStateReducer } from 'react-redux-firebase';
import { VMenuReducer, VMenuState } from 'react-vmenu';
import { firestoreReducer } from 'redux-firestore';
import { DeepGet, DeepSet, IsString, Assert } from 'js-vextensions';
import { CombineReducers_Advanced, bufferedActions, HandleError, manager, LogWarning } from 'Utils/FrameworkOverrides';
import { FeedbackReducer } from 'firebase-feedback';
import { persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { omit } from 'lodash';
import { MainReducer, MainState } from './main';

// class is used only for initialization
export class RootState {
	main: MainState;
	// firebase: FirebaseDatabase;
	firebase: any;
	firestore: any;
	// form: any;
	// router: RouterState;
	router: any;
	vMenu: VMenuState;
	/* forum: ForumData;
	feedback: FeedbackData; */
}
export function MakeRootReducer(pureOnly = false) {
	const innerReducer = CombineReducers_Advanced({
		/* preReduce: (state, action) => {
			// if (action.type == '@@reactReduxFirebase/START' || action.type == '@@reactReduxFirebase/SET') {
			if (action.type == '@@reactReduxFirebase/SET_LISTENER' || DoesActionSetFirestoreData(action)) {
				// const newFirebaseState = firebaseStateReducer(state.firebase, action);
				const newFirestoreState = firestoreReducer(state.firestore, action);

				// Watch for changes to requesting and requested, and channel those statuses into a custom pathReceiveStatuses map.
				// This way, when an action only changes these statuses, we can cancel the action dispatch, greatly reducing performance impact.
				NotifyPathsReceiving(newFirestoreState.status.requesting.Pairs().filter(a => a.value).map(a => a.key));
				NotifyPathsReceived(newFirestoreState.status.requested.Pairs().filter(a => a.value).map(a => a.key));

				// Here we check if the action changed more than just the statuses. If it didn't, then the action dispatch is canceled. (basically -- the action applies no state change, leading to store subscribers not being notified)
				const oldData = DeepGet(state.firebase.data, action['path']);
				const newData = DeepGet(newFirestoreState.data, action['path']);
				// if (newData === oldData) {
				if (newData === oldData || ToJSON(newData) === ToJSON(oldData)) {
					return state;
				}
			}
		}, */
		reducers: {
			main: MainReducer,
			firebase: firebaseStateReducer,
			firestore: firestoreReducer,
			// form: formReducer,
			vMenu: VMenuReducer,
			// forum: ForumReducer,
			feedback: FeedbackReducer,
			...manager.GetExtraReducers(),
		},
		actionSendInclusions: {
			/* '@@reactReduxFirebase/START': ['firebase'],
			'@@reactReduxFirebase/SET': ['firebase'], */
			'ACTSet_main/search/queryStr': ['main'],
		},
	});

	const outerReducer_prePersist = (state: RootState, rootAction) => {
		if (bufferedActions) {
			bufferedActions.push(rootAction);
			return state;
		}

		const actions = rootAction.type === 'ActionSet' ? rootAction.payload.actions : [rootAction];

		let result = state;
		for (const action of actions) {
			try {
				const oldResult = result;
				result = innerReducer(result, action) as RootState;
				if (action.type.startsWith('ACTSet_') && result === oldResult) {
					LogWarning(`An ${action.type} action was dispatched, but did not cause any change to the store contents! Did you forget to add a reducer entry?`);
				}
			} catch (ex) {
				HandleError(ex, true, { action });
			}
		}

		// make-so certain paths are ignored in redux-devtools-extension's Chart panel
		const ignorePaths = [
			'firestore/data',
		];
		for (const path of ignorePaths) {
			const data = DeepGet(result, path);
			if (data != null && data['toJSON'] == null) {
				data['toJSON'] = () => '[IGNORED]';
			}
		}

		return result;
	};
	if (pureOnly) return outerReducer_prePersist;

	const blacklistPaths = [
		'firebase', 'firestore', 'vmenu', // from above
		'router', // from vwebapp-framework
		// main sub-exclusions
		'main.notificationMessages', 'main.currentNodeBeingAdded_path', 'main.search.findNode_state',
	];
	const persistConfig = {
		key: 'reduxPersist_root',
		storage,
		blacklist: blacklistPaths.filter(a => !a.includes('.')),
		transforms: [
			// nested blacklist-paths require a custom transform to be applied
			createTransform((inboundState, key) => {
				if (!IsString(key)) throw Assert(false); // we want the type-guard (but not sure if this is correct)
				const blacklistPaths_forKey = blacklistPaths.filter(path => path.startsWith(`${key}.`)).map(path => path.substr(key.length + 1));
				return omit(inboundState as any, ...blacklistPaths_forKey);
			}, null),
		],
	};
	return persistReducer(persistConfig, outerReducer_prePersist);
}

/* function RouterReducer(state = {location: null}, action) {
	let oldURL = VURL.FromLocationObject(state.location);
	let newURL = oldURL.Clone();
	if (action.Is(ACTDebateMapSelect) && action.payload.id == null) {
		newURL.pathNodes.length = 1;
	}
	if (oldURL.toString() != newURL.toString()) {
		browserHistory.push(newURL.toString({domain: false}));
		return {...state, location: newURL.ToState()};
	}

	return routerReducer(state, action);
} */
