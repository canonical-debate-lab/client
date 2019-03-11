// import { ForumData } from 'firebase-forum';
import { FeedbackData_General, Proposal, UserData } from 'firebase-feedback';
import { Layer } from 'Store/firebase/layers/@Layer';
import { NodeEditTimes } from 'Store/firebase/mapNodeEditTimes';
import { MapNodeStats } from 'Store/firebase/nodeStats/@MapNodeStats';
import { User } from 'Store/firebase/users/@User';
import { State } from 'Utils/FrameworkOverrides';
import { GeneralData } from './firebase/general';
import { Image } from './firebase/images/@Image';
import { Map } from './firebase/maps/@Map';
import { RatingsRoot } from './firebase/nodeRatings/@RatingsRoot';
import { MapNode } from './firebase/nodes/@MapNode';
import { MapNodeRevision } from './firebase/nodes/@MapNodeRevision';
import { ViewerSet } from './firebase/nodeViewers/@ViewerSet';
import { TermComponent } from './firebase/termComponents/@TermComponent';
import { Term } from './firebase/terms/@Term';
import { UserExtraInfo } from './firebase/userExtras/@UserExtraInfo';
import { UserMapInfoSet } from './firebase/userMapInfo/@UserMapInfo';
import { ViewedNodeSet } from './firebase/userViewedNodes/@ViewedNodeSet';
import { TimelineStep } from './firebase/timelineSteps/@TimelineStep';
import { Timeline } from './firebase/timelines/@Timeline';
import { MapNodePhrasing } from './firebase/nodePhrasings/@MapNodePhrasing';

export interface FirebaseData {
	// modules
	'modules/feedback/general': FeedbackData_General;
	'modules/feedback/proposals': {[key: number]: Proposal};
	'modules/feedback/userData': {[key: string]: UserData};

	general: {data: GeneralData};
	images: {[key: string]: Image};
	layers: {[key: string]: Layer};
	/* maps: {
		[key: number]: Map
			& {nodeEditTimes: DataWrapper<NodeEditTimes>}; // nodeEditTimes -> $nodeID -> $nodeEditTime
	}; */
	maps: {[key: string]: Map};
	mapNodeEditTimes: {[key: string]: NodeEditTimes};
	nodes: {[key: string]: MapNode};
	// nodeExtras: {[key: string]: any};
	nodeRatings: {[key: string]: RatingsRoot}; // $nodeID (key) -> $ratingType -> $userID -> value -> $value
	nodeRevisions: {[key: string]: MapNodeRevision};
	// nodeStats: {[key: string]: MapNodeStats};
	// nodeViewers: {[key: string]: ViewerSet}; // removed due to privacy concerns
	nodePhrasings: {[key: string]: MapNodePhrasing};
	terms: {[key: string]: Term};
	termComponents: {[key: string]: TermComponent};
	termNames: {[key: string]: any};
	timelines: {[key: string]: Timeline};
	timelineSteps: {[key: string]: TimelineStep};
	users: {[key: string]: User};
	userExtras: {[key: string]: UserExtraInfo};
	userMapInfo: {[key: string]: UserMapInfoSet}; // $userID (key) -> $mapID -> layerStates -> $layerID -> [boolean, for whether enabled]
	// userViewedNodes: {[key: string]: ViewedNodeSet}; // removed due to privacy concerns
}

export function GetAuth() {
	return State('firebase', 'auth');
}
export function IsAuthValid(auth) {
	return auth && !auth.isEmpty;
}
