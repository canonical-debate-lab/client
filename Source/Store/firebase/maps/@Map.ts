import { GetValues_ForSchema } from 'js-vextensions';
import { AddSchema } from 'Utils/FrameworkOverrides';

export enum MapType {
	Personal = 10,
	Debate = 20,
	Global = 30,
}
export class Map {
	constructor(initialData: {name: string, type: MapType, creator: string} & Partial<Map>) {
		this.Extend(initialData);
		// this.createdAt = Date.now();
	}

	_id: number;
	name: string;
	note: string;
	noteInline = true;
	type: MapType;
	rootNode: number;
	defaultExpandDepth = 2;

	creator: string;
	createdAt: number;
	edits: number;
	editedAt: number;

	layers: {[key: number]: boolean};
	timelines: {[key: number]: boolean};
}
export const Map_namePattern = '^[a-zA-Z0-9 ,\'"%:.?\\-()\\/]+$';
// export const Map_namePattern = '^\\S.*$'; // must start with non-whitespace // todo: probably switch to a more lax pattern like this, eg. so works for other languages
AddSchema({
	properties: {
		name: { type: 'string', pattern: Map_namePattern },
		note: { type: 'string' },
		noteInline: { type: 'boolean' },
		type: { oneOf: GetValues_ForSchema(MapType) },
		rootNode: { type: 'number' },
		defaultExpandDepth: { type: 'number' },

		creator: { type: 'string' },
		createdAt: { type: 'number' },
		edits: { type: 'number' },
		editedAt: { type: 'number' },

		layers: { patternProperties: { '^[0-9]+$': { type: 'boolean' } } },
		timelines: { patternProperties: { '^[0-9]+$': { type: 'boolean' } } },
	},
	required: ['name', 'type', 'rootNode', 'creator', 'createdAt'],
}, 'Map');
