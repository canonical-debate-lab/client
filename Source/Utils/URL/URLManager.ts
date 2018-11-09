import { GetCurrentURLString, Vector2i, VURL } from "js-vextensions";
import { store } from "Main_Hot";
import { FindReact } from "react-vextensions";
import { State } from "Store";
import { GetMap } from "../../Store/firebase/maps";
import { ACTSetPage, ACTSetSubpage, GetPage, GetSubpage } from "../../Store/main";
import { GetNodeView } from "../../Store/main/mapViews";
import { ACTMapViewMerge } from "../../Store/main/mapViews/$mapView";
import { MapUI } from "../../UI/@Shared/Maps/MapUI";

export const rootPages = [
	"home",
	"gad",
];
// a default-child is only used (ie. removed from url) if there are no path-nodes after it
export const rootPageDefaultChilds = {
	home: "home",
}

export function GetCurrentURL(fromAddressBar = false) {
	return fromAddressBar ? VURL.Parse(GetCurrentURLString()) : VURL.FromState(State("router"));
}
export function NormalizeURL(url: VURL) {
	let result = url.Clone();
	if (!rootPages.Contains(result.pathNodes[0])) {
		result.pathNodes.Insert(0, "home");
	}
	if (result.pathNodes[1] == null && rootPageDefaultChilds[result.pathNodes[0]]) {
		result.pathNodes.Insert(1, rootPageDefaultChilds[result.pathNodes[0]]);
	}
	return result;
}

const pagesWithSimpleSubpages = ["home", "gad"].ToMap(page=>page, ()=>null);
export function GetSyncLoadActionsForURL(url: VURL, directURLChange: boolean) {
	let result = [];

	let page = url.pathNodes[0];
	result.push(new ACTSetPage(page).VSet({fromURL: true}));
	let subpage = url.pathNodes[1];
	if (url.pathNodes[1] && page in pagesWithSimpleSubpages) {
		result.push(new ACTSetSubpage({page, subpage}).VSet({fromURL: true}));
	}

	return result;
}

// maybe temp; easier than using the "fromURL" prop, since AddressBarWrapper class currently doesn't have access to the triggering action itself
export var loadingURL = false;
export async function LoadURL(urlStr: string) {
	//MaybeLog(a=>a.urlLoads, ()=>"Loading url: " + urlStr);
	loadingURL = true;

	//if (!GetPath(GetUrlPath(url)).startsWith("global/map")) return;
	let url = NormalizeURL(VURL.Parse(urlStr));

	let syncActions = GetSyncLoadActionsForURL(url, true);
	for (let action of syncActions) {
		store.dispatch(action);
	}

	let loadingMapView = syncActions.Any(a=>a.Is(ACTMapViewMerge));
	if (loadingMapView) {
		let mapUI = FindReact(document.querySelector(".MapUI")) as MapUI;
		if (mapUI) {
			mapUI.LoadScroll();
		}
	}

	loadingURL = false;
}

// saving
// ==========

//g.justChangedURLFromCode = false;
export function GetNewURL(includeMapViewStr = true) {
	//let newURL = URL.Current();
	/*let oldURL = URL.Current(true);
	let newURL = new VURL(oldURL.domain, oldURL.pathNodes);*/

	let newURL = new VURL();
	let page = GetPage();
	newURL.pathNodes.push(page);

	var subpage = GetSubpage();
	if (page in pagesWithSimpleSubpages) {
		newURL.pathNodes.push(subpage);
	}

	if (State(a=>a.main.urlExtraStr)) {
		newURL.SetQueryVar("extra", State(a=>a.main.urlExtraStr));
	}
	if (State(a=>a.main.envOverride)) {
		newURL.SetQueryVar("env", State(a=>a.main.envOverride));
	}
	if (State(a=>a.main.dbVersionOverride)) {
		newURL.SetQueryVar("dbVersion", State(a=>a.main.dbVersionOverride));
	}

	// a default-child is only used (ie. removed from url) if there are no path-nodes after it
	if (subpage && subpage == rootPageDefaultChilds[page] && newURL.pathNodes.length == 2) newURL.pathNodes.length = 1;
	if (page == "home" && newURL.pathNodes.length == 1) newURL.pathNodes.length = 0;

	Assert(!newURL.pathNodes.Any(a=>a == "/"), `A path-node cannot be just "/". @url(${newURL})`);

	return newURL;
}
function GetMapViewStr(mapID: number) {
	let map = GetMap(mapID);
	if (map == null) return "";
	let rootNodeID = map.rootNode;
	let rootNodeViewStr = GetNodeViewStr(mapID, rootNodeID.toString());
	rootNodeViewStr = rootNodeViewStr.TrimEnd("."); // remove .'s to keep shorter and cleaner
	//rootNodeViewStr += "_"; // add "_", so that Facebook doesn't cut off end special-chars
	return rootNodeViewStr;
}
export function GetNodeViewStr(mapID: number, path: string) {
	let nodeView = GetNodeView(mapID, path);
	if (nodeView == null) return "";

	let childrenStr = "";
	for (let childID of (nodeView.children || {}).VKeys(true)) {
		let childNodeViewStr = GetNodeViewStr(mapID, `${path}/${childID}`);
		if (childNodeViewStr.length) {
			childrenStr += (childrenStr.length ? "," : "") + childNodeViewStr;
		}
	}

	let ownIDStr = path.substr(path.lastIndexOf("/") + 1);
	let ownStr = ownIDStr;
	//if (nodeView.expanded && !childrenStr.length) ownStr += "e";
	//let mapView = GetMapView(mapID);
	if (nodeView.selected) {
		ownStr += "s";

		/*let viewCenter_onScreen = new Vector2i(window.innerWidth / 2, window.innerHeight / 2);
		let nodeBox = $(".NodeUI_Inner").ToList().FirstOrX(a=>(FindReact(a[0]) as NodeUI_Inner).props.path == path);
		let nodeBoxComp = FindReact(nodeBox[0]) as NodeUI_Inner;
		let viewOffset = viewCenter_onScreen.Minus(nodeBox.GetScreenRect().Position).NewX(x=>x.RoundTo(1)).NewY(y=>y.RoundTo(1));
		let offsetStr = viewOffset.toString().replace(" ", "_");
		ownStr += `(${offsetStr})`;*/
	}
	if (nodeView.focused) { // && GetSelectedNodeID(mapID) == null) {
		Assert(nodeView.viewOffset != null);
		let offsetStr = Vector2i.prototype.toString.call(nodeView.viewOffset).replace(" ", "_");
		ownStr += `f(${offsetStr})`;
	}
	if (nodeView.openPanel) {
		ownStr += `p(${nodeView.openPanel})`;
	}
	
	/*let hasData = false;
	if (childrenStr.length) hasData = true;
	else if (nodeView.expanded) hasData = true;*/
	let hasData = ownStr.length > ownIDStr.length || nodeView.expanded;
	if (!hasData) return "";

	let result = ownStr;
	if (nodeView.expanded) {
		let prefix = "";
		if (nodeView.expanded_truth && !nodeView.expanded_relevance) {
			prefix = "t";
		} else if (nodeView.expanded_relevance && !nodeView.expanded_truth) {
			prefix = "r";
		} else {
			// only include e if children-str is empty (if has child-str, then e is implied/not-needed)
			if (childrenStr.length == 0) {
				prefix = "e";
			}
		}

		result += prefix;
		if (childrenStr.length) {
			result += `:${childrenStr}.`;
		}
	}
	return result;
}