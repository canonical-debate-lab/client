import { firebaseStateReducer } from 'react-redux-firebase';
import { VMenuReducer, VMenuState } from 'react-vmenu';
import { MessageBoxReducer, MessageBoxState } from 'react-vmessagebox';
import { firestoreReducer } from 'redux-firestore';
import { DeepGet, DeepSet } from 'js-vextensions';
import { CombineReducers_Advanced, bufferedActions, HandleError, manager } from 'Utils/FrameworkOverrides';
import { FeedbackReducer } from 'firebase-feedback';
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
export function MakeRootReducer() {
	const extraReducers = manager.GetExtraReducers();

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
			...extraReducers,
		},
		actionSendInclusions: {
			/* '@@reactReduxFirebase/START': ['firebase'],
			'@@reactReduxFirebase/SET': ['firebase'], */
			'ACTSet_main/search/queryStr': ['main'],
		},
	});

	return (state: RootState, rootAction) => {
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
				// if (action.Is(ACTSet)) {
				// removed auto-apply code, because gets overwritten when a peer-field causes reducer to give new value (without field having reducer code...)
				/* if (action.type.startsWith("ACTSet_")) {
					result = u.updateIn(action.payload.path.replace(/\//g, "."), u.constant(action.payload.value), result);
				} */

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
			if (DeepGet(result, path) != null && DeepGet(state, path) == null) {
				DeepSet(result, `${path}/toJSON`, () => '[IGNORED]');
			}
		}

		return result;
	};
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
