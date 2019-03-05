import { ColorPickerBox } from 'react-vcomponents';
import * as react_color from 'react-color';
import * as chroma_js from 'chroma-js';
import Moment from 'moment';
import { MeID, GetUser, GetUserPermissionGroups, Me } from 'Store/firebase/users';
import { manager as manager_forum } from 'firebase-forum';
import { manager as manager_feedback } from 'firebase-feedback';
import { replace, push } from 'connected-react-router';
import Raven from 'raven-js';
import { version, dbVersion, hasHotReloaded, firebaseConfig } from 'Main';
import { Link, GetData, GetDataAsync, GetAsync, ApplyDBUpdates, VReactMarkdown_Remarkable, Connect, State, DBPath, ExposeModuleExports, manager as manager_framework } from 'Utils/FrameworkOverrides';
import { logTypes } from 'Utils/General/Logging';
import { GetLoadActionsForURL, GetNewURL } from 'Utils/URL/URLs';
import { MakeRootReducer } from 'Store';
import { GetAuth } from 'Store/firebase';
import { NotificationMessage } from 'Store/main/@NotificationMessage';
import { AddNotificationMessage } from 'UI/@Shared/NavBar/NotificationsUI';
import { PreDispatchAction, MidDispatchAction, PostDispatchAction, DoesURLChangeCountAsPageChange } from 'Utils/Store/ActionProcessor';
import { ShowSignInPopup } from './UI/@Shared/NavBar/UserPanel';

const context = (require as any).context('../Resources/SVGs/', true, /\.svg$/);
const iconInfo = {};
context.keys().forEach((filename) => {
	iconInfo[filename] = context(filename).default;
});

export function InitLibs() {
	ColorPickerBox.Init(react_color, chroma_js);

	manager_framework.Populate({
		iconInfo,

		env_short: ENV_SHORT,
		devEnv: DEV,
		prodEnv: PROD,
		dbVersion,
		HasHotReloaded: () => hasHotReloaded,
		logTypes,

		startURL,
		routerLocationPathInStore: ['router', 'location'],
		GetLoadActionsForURL,
		GetNewURL,
		DoesURLChangeCountAsPageChange,

		GetStore: () => store,
		firebaseConfig,
		MakeRootReducer,
		PreDispatchAction,
		MidDispatchAction,
		PostDispatchAction,

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

		router_replace: replace,
		router_push: push,

		logTypes,

		Connect,
		State,
		GetData: (options, ...pathSegments) => GetData(E(options, { inVersionRoot: false }), ...pathSegments),
		GetDataAsync: (options, ...pathSegments) => GetDataAsync(E(options, { inVersionRoot: false }), ...pathSegments),
		GetAsync,
		ShowSignInPopup,
		GetUserID: MeID,
		GetUser,
		GetUserPermissionGroups,

		ApplyDBUpdates,

		MarkdownRenderer: VReactMarkdown_Remarkable,
	};

	manager_feedback.Populate(sharedData.Extended({
		storePath_mainData: 'feedback',
		storePath_dbData: DBPath('modules/feedback'),
	}));
	manager_forum.Populate(sharedData.Extended({
		storePath_mainData: 'forum',
		storePath_dbData: DBPath('modules/forum'),
	}));

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
