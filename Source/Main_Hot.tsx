import { CreateStore } from "Utils/Store/CreateStore";
import {Store} from "redux";
import { RootState } from "Store";
import Action from "Utils/General/Action";
import ReactDOM from "react-dom";
import {ParseModuleData, Require, GetModuleNameFromPath} from "webpack-runtime-require";

export var {store, persister} = CreateStore({}, {});
window["store"] = store;
declare global {
	type ProjectStore = Store<RootState> & {reducer: (state: RootState, action: Action<any>)=>RootState};
	var store: ProjectStore;
}

const mountNode = document.getElementById("root");
let {RootUIWrapper} = require("./UI/Root");
ReactDOM.render(<RootUIWrapper store={store}/>, mountNode);

if (DEV) {
	SetUpRR();
} else {
	window["RR"] = SetUpRR;
}

export function SetUpRR() {
	setTimeout(()=> {
		ParseModuleData(true);
		window["R"] = Require;

		let RR = {};
		let moduleEntries = (Require as any).Props();
		// add modules from dll-bundle as well
		for (let dllEntry of Require["dll_reference vendor"].c.Props()) {
			let moduleName = GetModuleNameFromPath(dllEntry.name);
			Require[moduleName] = dllEntry.value.exports;
			moduleEntries.push({name: moduleName, value: dllEntry.value.exports});
		}
		
		for (let {name: moduleName, value: moduleExports} of moduleEntries) {
			if (moduleExports == null) continue;
			//if (moduleExports == null || (IsString(moduleExports) && moduleExports == "[failed to retrieve module exports]")) continue;

			for (let key in moduleExports) {
				let finalKey = key;
				while (finalKey in RR) finalKey += `_`;
				RR[finalKey] = moduleExports[key];
			}

			//let defaultExport = moduleExports.default || moduleExports;
			if (moduleExports.default) {
				let finalKey = moduleName;
				while (finalKey in RR) finalKey += `_`;
				RR[finalKey] = moduleExports.default;
			}
		}
		window["RR"] = RR;
	}, 500); // wait a bit, since otherwise some modules are missed/empty during ParseModuleData it seems
}