/*
To override an export, add a line like this:
	export {FunctionA} from "./FunctionA";

Then create the corresponding file, with contents like this:
	export function FunctionA() {
		console.log("New function contents");
	}
	VWAF_OverrideExport(FunctionA);

For short-term substitutions (like adding a log line to debug something), you can also just place the override code at the bottom of this file.
*/

// import { VWAF_OverrideExport, accessedStorePaths, activeStoreAccessCollectors } from 'vwebapp-framework/Source';

export * from 'vwebapp-framework/Source/index';
export * from './TypedReExports';

// test
// ==========

/* export function OnAccessPath(path: string) {
	Log(`Accessing-path Stage1: ${path}`);
}
VWAF_OverrideExport(OnAccessPath); */
