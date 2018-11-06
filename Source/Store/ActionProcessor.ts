import { Action } from "Utils/Store/Action";
import { ProcessDBData, GetDataAsync, DBPath } from "Utils/Database/DatabaseHelpers";
import { SplitStringBySlash_Cached } from "Utils/Database/StringSplitCache";
import { VURL } from "js-vextensions";

//export function ProcessAction(action: Action<any>, newState: RootState, oldState: RootState) {
// only use this if you actually need to change the action-data before it gets dispatched/applied (otherwise use [Mid/Post]DispatchAction)
export function PreDispatchAction(action: Action<any>) {
	//MaybeLog(a=>a.actions, ()=>`Dispatching: ${action.type} JSON:${ToJSON(action)}`);

	if (action.type == "@@reactReduxFirebase/SET") {
		if (action["data"]) {
			action["data"] = ProcessDBData(action["data"], true, true, SplitStringBySlash_Cached(action["path"]).Last());
		} else {
			// don't add the property to the store, if it is just null anyway (this makes it consistent with how firebase returns the whole db-state)
			delete action["data"];
		}
	}
}

export function DoesURLChangeCountAsPageChange(oldURL: VURL, newURL: VURL, directURLChange: boolean) {
	if (oldURL == null) return true;
	if (oldURL.PathStr() != newURL.PathStr()) return true;
	
	return false;
}
export function RecordPageView(url: VURL) {
	//let url = window.location.pathname;
	/*ReactGA.set({page: url.toString({domain: false})});
	ReactGA.pageview(url.toString({domain: false}) || "/");
	MaybeLog(a=>a.pageViews, ()=>"Page-view: " + url);*/
}

export async function PostDispatchAction(action: Action<any>) {
	if (action.type == "@@reactReduxFirebase/LOGIN") {
		let userID = action["auth"].uid;
		let joinDate = await GetDataAsync("userExtras", userID, "joinDate");
		if (joinDate == null) {
			let firebase = store.firebase.helpers;
			firebase.ref(DBPath(`userExtras/${userID}`)).update({
				permissionGroups: {basic: true, verified: true, mod: false, admin: false},
				joinDate: Date.now(),
			});
		}
	}
}