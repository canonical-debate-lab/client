import { Feedback_store, manager as manager_feedback } from 'firebase-feedback';
import { DBPath } from 'mobx-firelink';
import Moment from 'moment';
import { store } from 'Store';
import { GetUser, GetUserPermissionGroups, MeID } from 'Store/firebase/users';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { logTypes } from 'Utils/General/Logging';
import { PushHistoryEntry } from 'Utils/URL/URLs';
import { Link, VReactMarkdown_Remarkable } from 'vwebapp-framework';

export function InitFeedback() {
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
	store.feedback = Feedback_store;
}
