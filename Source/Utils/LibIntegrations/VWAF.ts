import { dbVersion, hasHotReloaded } from 'Main';
import { RootState, store } from 'Store';
import { GetAuth } from 'Store/firebase';
import { GetUserPermissionGroups, Me, MeID } from 'Store/firebase/users';
import { NotificationMessage } from 'Store/main';
import { AddNotificationMessage } from 'UI/@Shared/NavBar/NotificationsUI';
import { logTypes, LogTypes_New } from 'Utils/General/Logging';
import { ValidateDBData } from 'Utils/Store/DBDataValidator';
import { DoesURLChangeCountAsPageChange, GetLoadActionFuncForURL, GetNewURL } from 'Utils/URL/URLs';
import { manager as manager_framework } from 'vwebapp-framework';
import './VWAF/Overrides';

const context = (require as any).context('../../../Resources/SVGs/', true, /\.svg$/);
const iconInfo = {};
context.keys().forEach((filename) => {
	iconInfo[filename] = context(filename).default;
});

declare module 'vwebapp-framework/Source/UserTypes' {
	interface RootStore extends RootState {}
	// interface DBShape extends FirebaseDBShape {}
	interface LogTypes extends LogTypes_New {}
}

export function InitVWAF() {
	manager_framework.Populate({
		iconInfo,

		db_short: DB_SHORT,
		devEnv: DEV,
		prodEnv: PROD,
		dbVersion,
		HasHotReloaded: () => hasHotReloaded,
		logTypes,
		mobxCompatMode: true,

		startURL,
		routerLocationPathInStore: ['router', 'location'],
		GetLoadActionFuncForURL,
		GetNewURL,
		DoesURLChangeCountAsPageChange,

		GetStore: () => store,
		// WithStore,
		// firebaseConfig,

		globalConnectorPropGetters: {
			// also access some other paths here, so that when they change, they trigger ui updates for everything
			_user: () => Me(),
			_permissions: () => GetUserPermissionGroups(MeID()),
			// _extraInfo: function() { return this.extraInfo; }, // special debug info from within FirebaseConnect function
		},

		PostHandleError: (error, errorStr) => {
			// wait a bit, in case we're in a reducer function (calling dispatch from within a reducer errors)
			setTimeout(() => {
				AddNotificationMessage(new NotificationMessage(errorStr));
			});
		},

		GetAuth,
		GetUserID: MeID,

		ValidateDBData,
	});
}
