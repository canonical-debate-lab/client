import { combineReducers, ReducersMapObject } from 'redux';
import { emptyArray_forLoading, emptyArray } from 'js-vextensions';
import { Action } from '../General/Action';

export function CombineReducers(reducerMap: {[key: string]: (state, action: Action<any>)=>any});
export function CombineReducers(getInitialState: ()=>any, reducerMap: {[key: string]: (state, action: Action<any>)=>any});
export function CombineReducers(...args) {
	let getInitialState; let
		reducerMap;
	if (args.length == 1) [reducerMap] = args;
	else [getInitialState, reducerMap] = args;

	if (getInitialState) {
		const reducer = combineReducers(reducerMap);
		return (state = getInitialState(), action) => {
		// return (state = getInitialState().VAct(a=>Object.setPrototypeOf(a, Object.getPrototypeOf({}))), action)=> {
		// return (state, action)=> {
			/* state = state || getInitialState().VAct(a=>Object.setPrototypeOf(a, Object.getPrototypeOf({})));
			Assert(Object.getPrototypeOf(state) == Object.getPrototypeOf({})); */
			// combineReducers is picky; it requires it be passed a plain object; thus, we oblige ;-(
			Object.setPrototypeOf(state, Object.getPrototypeOf({}));
			return reducer(state, action);
		};
	}
	return combineReducers(reducerMap);
}

interface Options {
	getInitialState?: ()=>any;
	/** Return something other than undefined to have the reducer quick-return that as the new state. (instead of running the regular subreducers) */
	preReduce?: (state, action: Action<any>)=>any;
	reducers: ReducersMapObject;
	actionSendInclusions?: {[key: string]: string[]};
	actionSendExclusions?: {[key: string]: string[]};
}
export function CombineReducers_Advanced(options: Options) {
	const reducerKeys = Object.keys(options.reducers);
	options.actionSendInclusions = options.actionSendInclusions || {};
	options.actionSendExclusions = options.actionSendExclusions || {};

	const actionTypesIncludedOrExcluded = options.actionSendInclusions.VKeys().concat(options.actionSendExclusions.VKeys()).Distinct();
	const reducers_actionsToSkip = {};
	for (const reducerKey of reducerKeys) {
		reducers_actionsToSkip[reducerKey] = {};
		for (const actionType of actionTypesIncludedOrExcluded) {
			let skipActionType = false;
			if (options.actionSendInclusions[actionType] && !options.actionSendInclusions[actionType].Contains(reducerKey)) {
				skipActionType = true;
			}
			if (options.actionSendExclusions[actionType] && options.actionSendExclusions[actionType].Contains(reducerKey)) {
				skipActionType = true;
			}
			if (skipActionType) {
				reducers_actionsToSkip[reducerKey][actionType] = true;
			}
		}
	}

	return (state = options.getInitialState ? options.getInitialState().Strip() : {}, action: Action<any>) => {
		if (options.preReduce) {
			const preReduceResult = options.preReduce(state, action);
			if (preReduceResult !== undefined) return preReduceResult;
		}

		let hasChanged = false;
		const nextState = {};
		for (let i = 0; i < reducerKeys.length; i++) {
			const key = reducerKeys[i];
			if (reducers_actionsToSkip[key][action.type]) {
				nextState[key] = state[key];
				continue;
			}

			const reducer = options.reducers[key];
			nextState[key] = reducer(state[key], action);
			hasChanged = hasChanged || nextState[key] !== state[key];
		}
		return hasChanged ? nextState : state;
	};
}

// use a singleton for empty-obj and empty-array (that way VCache and other shallow-compare systems work with them)
export function IsSpecialEmptyArray<T>(array: Array<T>) {
	return array == emptyArray || array == emptyArray_forLoading;
}
