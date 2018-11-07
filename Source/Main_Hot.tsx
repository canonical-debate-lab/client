import React from 'react';
import ReactDOM from 'react-dom';
import { CreateStore } from 'Utils/Store/CreateStore';
import { GetModuleNameFromPath, ParseModuleData, Require } from 'webpack-runtime-require';
import { Store } from 'redux';
import { RootState } from 'Store';
import { Action } from 'Utils/Store/Action';
import { RootUIWrapper } from 'UI/Root';

export const { store, persister } = CreateStore({});
export type ProjectStore = Store<RootState> & {reducer: (state: RootState, action: Action<any>)=>RootState}; // eslint-disable-line

const mountNode = document.getElementById('root');
ReactDOM.render(<RootUIWrapper store={store}/>, mountNode);

if (DEV) {
	SetUpRR();
} else {
	window['RR'] = SetUpRR;
}

export function SetUpRR() {
	setTimeout(() => {
		ParseModuleData(true);
		window['R'] = Require;

		const RR = {};
		const moduleEntries = (Require as any).Props();
		// add modules from dll-bundle as well
		for (const dllEntry of Require['dll_reference vendor'].c.Props()) {
			const moduleName = GetModuleNameFromPath(dllEntry.name);
			Require[moduleName] = dllEntry.value.exports;
			moduleEntries.push({ name: moduleName, value: dllEntry.value.exports });
		}

		for (let { name: moduleName, value: moduleExports } of moduleEntries) { // eslint-disable-line
			if (moduleExports == null) continue;
			// if (moduleExports == null || (IsString(moduleExports) && moduleExports == '[failed to retrieve module exports]')) continue;

			for (const key of Object.keys(moduleExports)) {
				let finalKey = key;
				while (finalKey in RR) finalKey += `_`;
				RR[finalKey] = moduleExports[key];
			}

			// let defaultExport = moduleExports.default || moduleExports;
			if (moduleExports.default) {
				let finalKey = moduleName;
				while (finalKey in RR) finalKey += `_`;
				RR[finalKey] = moduleExports.default;
			}
		}
		window['RR'] = RR;
	}, 500); // wait a bit, since otherwise some modules are missed/empty during ParseModuleData it seems
}