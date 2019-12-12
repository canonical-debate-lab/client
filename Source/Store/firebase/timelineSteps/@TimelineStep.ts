import { AddSchema } from 'vwebapp-framework';

export class TimelineStep {
	constructor(initialData: Partial<TimelineStep>) {
		this.Extend(initialData);
	}

	_key: string;
	timelineID: string;
	title: string;
	groupID: number;
	// if timeline has video
	videoTime: number;

	message: string;

	nodeReveals: NodeReveal[];
}
AddSchema('TimelineStep', {
	properties: {
		timelineID: { type: 'string' },
		title: { type: 'string' },
		groupID: { type: ['number', 'null'] },
		videoTime: { type: ['number', 'null'] },

		message: { type: 'string' },

		nodeReveals: { $ref: 'NodeReveal' },
	},
	required: ['timelineID'],
});

export class NodeReveal {
	path: string;
	revealDepth: number;
}
AddSchema('NodeReveal', {
	properties: {
		path: { type: 'string' },
		revealDepth: { type: 'number' },
	},
	required: ['path', 'revealDepth'],
});
