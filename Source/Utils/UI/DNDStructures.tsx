export class DroppableInfo {
	constructor(data: Partial<DroppableInfo>) {
		this.Extend(data);
	}
	type: 'NodeChildHolder';

	// if NodeChildHolder
	parentPath?: string;
	subtype?: 'up' | 'down';
}
export class DraggableInfo {
	constructor(data: Partial<DraggableInfo>) {
		this.Extend(data);
	}

	// if in NodeChildHolder
	nodePath?: string;
}
