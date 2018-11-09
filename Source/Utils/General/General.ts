import 'Main';
import { GetStackTraceStr, emptyEntities } from 'js-vextensions';

type LogOptions = {appendStackTrace?: boolean, logLater?: boolean};
declare global {
	function Log(options: LogOptions, ...messageSegments: any[]);
	function Log(...messageSegments: any[]);
}
window['Log'] = (...args) => {
	let options: LogOptions = {};
	let messageSegments: any[];
	if (typeof args[0] === 'object') [options, ...messageSegments] = args;
	else messageSegments = args;
	// #mms: add-stack-trace-and-current-call-info-to-logs setting exists

	if (options.appendStackTrace) {
		/* if (inUnity)
			finalMessage += "\n\nStackTrace) " + new Error().stack;
		else */
		messageSegments.push(`\n@${GetStackTraceStr()}`);
	}

	console.log(...messageSegments);

	return messageSegments.length === 1 ? messageSegments[0] : messageSegments;
}


// use a singleton for empty-obj and empty-array (that way VCache and other shallow-compare systems work with them)
export const emptyObj = {};
export const emptyArray = [];
export const emptyArray_forLoading = []; // this one causes the "..." to show for node-children which are loading
export function IsSpecialEmptyArray<T>(array: Array<T>) {
	return array == emptyArray || array == emptyArray_forLoading;
}
// use the same empty-entities in js-vextensions
emptyEntities.VSet({emptyObj, emptyArray, emptyArray_forLoading});