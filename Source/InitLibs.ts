import * as chroma_js from 'chroma-js';
import { dbVersion, hasHotReloaded, version, firebaseConfig } from 'Main';
import Moment from 'moment';
import Raven from 'raven-js';
import * as react_color from 'react-color';
import { ColorPickerBox } from 'react-vcomponents';
import { store } from 'Store';
import { GetAuth } from 'Store/firebase';
import { GetUser, GetUserPermissionGroups, Me, MeID } from 'Store/firebase/users';
import { NotificationMessage } from 'Store/main';
import { AddNotificationMessage } from 'UI/@Shared/NavBar/NotificationsUI';
import { ExposeModuleExports, Link, Log, manager as manager_framework, VReactMarkdown_Remarkable } from 'Utils/FrameworkOverrides';
import { logTypes } from 'Utils/General/Logging';
import { ValidateDBData } from 'Utils/Store/DBDataValidator';
import { GetLoadActionFuncForURL, GetNewURL, PushHistoryEntry, DoesURLChangeCountAsPageChange } from 'Utils/URL/URLs';
import { DBPath } from 'mobx-firelink';
import { manager as manager_feedback } from 'firebase-feedback';
import firebase from 'firebase/app';
import { ShowSignInPopup } from './UI/@Shared/NavBar/UserPanel';

const context = (require as any).context('../Resources/SVGs/', true, /\.svg$/);
const iconInfo = {};
context.keys().forEach((filename) => {
	iconInfo[filename] = context(filename).default;
});

export function InitLibs() {
	// set some globals
	G({ Log });

	// if first run (in firebase-mock/test, or not hot-reloading), initialize the firebase app/sdk
	// if (!firebaseAppIsReal || firebaseApp.apps.length == 0) {
	firebase.initializeApp(firebaseConfig);

	ColorPickerBox.Init(react_color, chroma_js);

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

	// g.FirebaseConnect = Connect;
	const sharedData = {
		GetStore: () => store,
		/* GetNewURL: (actionsToDispatch: Action<any>[])=> {
			let newState = State();
			for (let action of actionsToDispatch) {
				newState = store.reducer(newState, action);
			}
			StartStateDataOverride("", newState);
			StartStateCountAsAccessOverride(false);
			let newURL = GetNewURL();
			StopStateCountAsAccessOverride();
			StopStateDataOverride();
			return newURL;
		}, */
		Link: Link as any,
		FormatTime: (time: number, formatStr: string) => {
			if (formatStr == '[calendar]') {
				const result = Moment(time).calendar();
				// if (result.includes("/")) return Moment(time).format("YYYY-MM-DD");
				return result;
			}
			return Moment(time).format(formatStr);
		},

		/* router_replace: replace,
		router_push: push, */
		/* RunActionFuncAsPageReplace: (actionFunc: ActionFunc<RootState>) => {
			// todo
		},
		RunActionFuncAsPagePush: (actionFunc: ActionFunc<RootState>) => {
			// todo
		}, */
		PushHistoryEntry,

		logTypes,

		ShowSignInPopup,
		GetUserID: MeID,
		GetUser,
		GetUserPermissionGroups,

		MarkdownRenderer: VReactMarkdown_Remarkable,
	};

	manager_feedback.Populate(sharedData.Extended({
		dbPath: DBPath({}, 'modules/feedback'),
		// storePath_mainData: 'feedback',
	}));
	/* manager_forum.Populate(sharedData.Extended({
		storePath_mainData: 'forum',
		storePath_dbData: DBPath({}, 'modules/forum'),
	})); */

	// expose exports
	if (DEV) {
		setTimeout(() => {
			ExposeModuleExports();
		}, 500); // wait a bit, since otherwise some modules are missed/empty during ParseModuleData it seems
	} else {
		G({ RR: () => ExposeModuleExports() });
	}

	if (PROD && window.location.hostname != 'localhost') { // if localhost, never enable Raven (even if env-override is set to production)
		Raven.config('https://40c1e4f57e8b4bbeb1e5b0cf11abf9e9@sentry.io/155432', {
			release: version,
			environment: ENV,
		}).install();
	}

	// You know what? It's better to just disable this until you specifically want to use it... (causes too many seemingly-false-positives otherwise)
	/* if (devEnv) {
		// this logs warning if a component doesn't have any props or state change, yet is re-rendered
		const {whyDidYouUpdate} = require("why-did-you-update");
		whyDidYouUpdate(React, {
			exclude: new RegExp(
				`connect|Connect|Link`
				+ `|Animate|Animation|Dot|ComposedDataDecorator|Chart|Curve|Route|ReferenceLine|Text` // from recharts
				+ `|Div` // from ScrollView (probably temp)
				//+ `|Button` // from react-social-button>react-bootstrap
				+ `|VReactMarkdown`
			),
		});
	} */
}

// patch React.createElement to do early prop validation
// ==========

const createElement_old = React.createElement;
React.createElement = function (componentClass, props) {
	if (componentClass.ValidateProps) {
		componentClass.ValidateProps(props);
	}
	return createElement_old.apply(this, arguments);
};
