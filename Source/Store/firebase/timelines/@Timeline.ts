import { AddSchema } from 'Utils/FrameworkOverrides';

export class Timeline {
	constructor(initialData: {name: string, creator: string} & Partial<Timeline>) {
		this.Extend(initialData);
	}

	_key: string;
	mapID: string;
	name: string;
	creator: string;
	createdAt: number;

	steps: string[];
}
AddSchema({
	properties: {
		mapID: { type: 'string' },
		name: { type: 'string' },
		creator: { type: 'string' },
		createdAt: { type: 'number' },

		steps: { items: { type: 'string' } },
	},
	required: ['mapID', 'name', 'creator', 'createdAt'],
}, 'Timeline');
