import { ForumData } from 'firebase-forum';
import { Layer } from 'Store/firebase/layers/@Layer';
import { NodeEditTimes } from 'Store/firebase/maps/nodeEditTimes';
import { MapNodeStats } from 'Store/firebase/nodeStats/@MapNodeStats';
import { User } from 'Store/firebase/users/@User';
import { DataWrapper } from 'Server/Server';
import { Action } from 'Frame/General/Action';
import { GeneralData } from './firebase/general';
import { Image } from './firebase/images/@Image';
import { Map } from './firebase/maps/@Map';
import { RatingsRoot } from './firebase/nodeRatings/@RatingsRoot';
import { MapNode } from './firebase/nodes/@MapNode';
import { MapNodeRevision } from './firebase/nodes/@MapNodeRevision';
import { ViewerSet } from './firebase/nodeViewers/@ViewerSet';
import { TermComponent } from './firebase/termComponents/@TermComponent';
import { Term } from './firebase/terms/@Term';
import UserExtraInfo from './firebase/userExtras/@UserExtraInfo';
import { UserMapInfoSet } from './firebase/userMapInfo/@UserMapInfo';
import { ViewedNodeSet } from './firebase/userViewedNodes/@ViewedNodeSet';

export interface FirebaseData {
	forum: ForumData;
	general: {data: GeneralData};
	images: {[key: string]: Image};
	layers: {[key: number]: Layer};
	maps: {
		[key: number]: Map
			& {nodeEditTimes: DataWrapper<NodeEditTimes>}; // nodeEditTimes -> $nodeID -> $nodeEditTime
	};
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
	return State('firebase', 'auth');
}
export function IsAuthValid(auth) {
	return auth && !auth.isEmpty;
}

export function DoesActionSetFirestoreData(action: Action<any>) {
	return action.type == '@@reduxFirestore/LISTENER_RESPONSE' || action.type == '@@reduxFirestore/DOCUMENT_ADDED' || action.type == '@@reduxFirestore/DOCUMENT_MODIFIED';
}
