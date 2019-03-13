import { UUID } from 'Utils/General/KeyGenerator';

export class DroppableInfo {
	constructor(data: Partial<DroppableInfo>) {
		this.Extend(data);
	}
	type: 'NodeChildHolder';

	// if NodeChildHolder
	parentPath?: string;
	subtype?: 'up' | 'down';
	childIDs?: UUID[];
}
export class DraggableInfo {
	constructor(data: Partial<DraggableInfo>) {
		this.Extend(data);
	}

	// if in NodeChildHolder
	mapID?: UUID;
	nodePath?: string;
}
