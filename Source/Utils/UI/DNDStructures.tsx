import { UUID } from 'Utils/General/KeyGenerator';

export class DroppableInfo {
	constructor(data: Partial<DroppableInfo>) {
		this.Extend(data);
	}
	type: 'NodeChildHolder' | 'TimelineStepList' | 'TimelineStepNodeRevealList';

	// if NodeChildHolder
	parentPath?: string;
	subtype?: 'up' | 'down';
	childIDs?: UUID[];

	// if TimelineStepList
	timelineID?: string;

	// if TimelineStepNodeRevealList
	stepID?: string;
}
export class DraggableInfo {
	constructor(data: Partial<DraggableInfo>) {
		this.Extend(data);
	}

	// if MapNode (in NodeChildHolder)
	mapID?: UUID;
	nodePath?: string;

	// if TimelineStep (in TimelineStepList)
	stepID?: string;
}
