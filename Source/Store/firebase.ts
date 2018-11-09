import UserExtraInfo from "./firebase/userExtras/@UserExtraInfo";
import {MapNode} from "./firebase/nodes/@MapNode";
import {RatingsSet, RatingsRoot} from "./firebase/nodeRatings/@RatingsRoot";
import {Term} from "./firebase/terms/@Term";
import {Map} from "./firebase/maps/@Map";
import TermComponent from "./firebase/termComponents/@TermComponent";
import { GeneralData } from "./firebase/general";
import {ViewerSet} from "./firebase/nodeViewers/@ViewerSet";
import {Image} from "./firebase/images/@Image";
import {MapNodeStats} from "Store/firebase/nodeStats/@MapNodeStats";
import {ViewedNodeSet} from "./firebase/userViewedNodes/@ViewedNodeSet";
import { ForumData } from "firebase-forum";
import { Layer } from "Store/firebase/layers/@Layer";
import {UserMapInfoSet} from "./firebase/userMapInfo/@UserMapInfo";
import {MapNodeRevision} from "./firebase/nodes/@MapNodeRevision";
import {NodeEditTimes} from "Store/firebase/mapNodeEditTimes";
import {User} from "Store/firebase/users/@User";

export interface FirebaseData {
	forum: ForumData;
	general: GeneralData;
	images: {[key: string]: Image};
	layers: {[key: number]: Layer};
	maps: {[key: number]: Map};
	mapNodeEditTimes: {[key: number]: NodeEditTimes} // $mapID (key) -> $nodeID -> $nodeEditTime
	nodes: {[key: number]: MapNode};
	nodeExtras: {[key: number]: any};
	nodeRatings: {[key: number]: RatingsRoot}; // $nodeID (key) -> $ratingType -> $userID -> value -> $value
	nodeRevisions: {[key: number]: MapNodeRevision};
	nodeStats: {[key: number]: MapNodeStats};
	nodeViewers: {[key: number]: ViewerSet};
	terms: {[key: number]: Term};
	termComponents: {[key: number]: TermComponent};
	termNames: {[key: string]: any};
	users: {[key: string]: User};
	userExtras: {[key: string]: UserExtraInfo};
	userMapInfo: {[key: string]: UserMapInfoSet}; // $userID (key) -> $mapID -> layerStates -> $layerID -> [boolean, for whether enabled]
	userViewedNodes: {[key: string]: ViewedNodeSet};
}

export function GetAuth() {
	return State("firebase", "auth");
}
export function IsAuthValid(auth) {
	return auth && !auth.isEmpty;
}