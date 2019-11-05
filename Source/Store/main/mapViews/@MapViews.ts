import { Vector2i } from 'js-vextensions';
import { MapNodeType, MapNodeLinkType } from 'Store/firebase/nodes/@MapNodeType';
import { MapNode } from 'Store/firebase/nodes/@MapNode';

export class MapViews {
	[key: number]: MapView;
}
export class MapView {
	// rootNodeView = new MapNodeView();
	// include root-node-view as a keyed-child, so that it's consistent with descendants (of key signifying id)
	// rootNodeView;
	rootNodeViews = {} as {[key: number]: MapNodeView};

	// if bot
	bot_currentNodeID?: number;
}
export class MapNodeView {
	// constructor(childLimit?: number) {
	// constructor(childLimit: number) {
	/* constructor() {
		this.childLimit = State(a=>a.main.initialChildLimit);
	} */
	constructor(linkType: MapNodeLinkType, autoExpandMain = false, autoExpandRelevance = false) {
		this.linkType = linkType;
		/* if (type == MapNodeType.Claim) {
			this.expanded_main = true;
		} */
		/* if (linkType == MapNodeLinkType.Simple) {
			this.expanded_main = true;
		} else if (linkType == MapNodeLinkType.RelevanceArgument) {
			this.expanded_relevance = true;
		} */
		if (autoExpandMain) this.expanded_main = true;
		if (autoExpandRelevance) this.expanded_relevance = true;
	}

	// type: MapNodeType;
	linkType?: MapNodeLinkType;
	selected?: boolean;
	focused?: boolean;
	/** Offset of view-center from self (for when we're the focus-node) */
	viewOffset?: Vector2i;
	openPanel?: string;
	openTermID?: string;

	expanded_main?: boolean;
	expanded_relevance?: boolean;
	children? = {} as {[key: string]: MapNodeView};
	childLimit_up?: number;
	childLimit_down?: number;
}
