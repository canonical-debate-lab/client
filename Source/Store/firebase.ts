import { ObservableMap } from 'mobx';
import { O } from 'vwebapp-framework/Source';
import {StoreAccessor} from 'Utils/FrameworkOverrides';
import { GeneralData } from './firebase/general';
import { Image } from './firebase/images/@Image';
import { Layer } from './firebase/layers/@Layer';
import { NodeEditTimes } from './firebase/mapNodeEditTimes';
import { Map } from './firebase/maps/@Map';
import { MapNodePhrasing } from './firebase/nodePhrasings/@MapNodePhrasing';
import { RatingsRoot } from './firebase/nodeRatings/@RatingsRoot';
import { MapNode } from './firebase/nodes/@MapNode';
import { MapNodeRevision } from './firebase/nodes/@MapNodeRevision';
import { TermComponent } from './firebase/termComponents/@TermComponent';
import { Term } from './firebase/terms/@Term';
import { Timeline } from './firebase/timelines/@Timeline';
import { TimelineStep } from './firebase/timelineSteps/@TimelineStep';
import { UserExtraInfo } from './firebase/userExtras/@UserExtraInfo';
import { UserMapInfoSet } from './firebase/userMapInfo/@UserMapInfo';
import { User } from './firebase/users/@User';

export class FirebaseState {
	@O modules: Firebase_ModulesState;

	@O general: {data: GeneralData};
	@O images: ObservableMap<string, Image>;
	@O layers: ObservableMap<string, Layer>;
	/* @O maps: {
		[key: number]: Map
			& {nodeEditTimes: DataWrapper<NodeEditTimes>}; // nodeEditTimes -> $nodeID -> $nodeEditTime
	}; */
	@O maps: ObservableMap<string, Map>;
	@O mapNodeEditTimes: ObservableMap<string, NodeEditTimes>;
	@O nodes: ObservableMap<string, MapNode>;
	// @O nodeExtras: {[key: string]: any};
	@O nodeRatings: ObservableMap<string, RatingsRoot>; // $nodeID (key) -> $ratingType -> $userID -> value -> $value
	@O nodeRevisions: ObservableMap<string, MapNodeRevision>;
	// @O nodeStats: {[key: string]: MapNodeStats};
	// @O nodeViewers: {[key: string]: ViewerSet}; // removed due to privacy concerns
	@O nodePhrasings: ObservableMap<string, MapNodePhrasing>;
	@O terms: ObservableMap<string, Term>;
	@O termComponents: ObservableMap<string, TermComponent>;
	@O termNames: ObservableMap<string, any>;
	@O timelines: ObservableMap<string, Timeline>;
	@O timelineSteps: ObservableMap<string, TimelineStep>;
	@O users: ObservableMap<string, User>;
	@O userExtras: ObservableMap<string, UserExtraInfo>;
	@O userMapInfo: ObservableMap<string, UserMapInfoSet>; // $userID (key) -> $mapID -> layerStates -> $layerID -> [boolean, for whether enabled]
	// @O userViewedNodes: {[key: string]: ViewedNodeSet}; // removed due to privacy concerns
}

export class Firebase_ModulesState {
	@O feedback: Firebase_FeedbackState;
}

export const GetAuth = StoreAccessor((s) => () => {
	return s.firebase.auth;
});
