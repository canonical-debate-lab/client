import { Range } from 'js-vextensions';
import { dbVersion } from 'Main';
import { RootState } from 'Store';
import { ACTSet } from 'Utils/FrameworkOverrides';

export function ProcessRehydrateData(data: RootState) {
	const lastDBVersionNotStored = 11;
	const lastDBVersion = (data && data.main && data.main.lastDBVersion) || lastDBVersionNotStored;
	UpgradeStoreState(data, lastDBVersion, dbVersion);
	store.dispatch(new ACTSet(a => a.main.lastDBVersion, dbVersion));
}

export function UpgradeStoreState(data, oldVersion: number, newVersion: number) {
	Range(oldVersion + 1, newVersion).forEach((newVersion) => {
		if (newVersion == 12) UpgradeStoreState_12(data);
	});
}
export function UpgradeStoreState_12(data: RootState) {
	// we don't actually need to do anything for v12, since we changed redux-persist key
}
