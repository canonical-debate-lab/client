import { DataWrapper } from 'Server/Server';
import { GetValues_ForSchema } from '../../../Frame/General/Enums';

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

		// collections (added here for Validate_LateHeavy, since schemas can't differentiate object-data under path vs collections under path)
		nodeEditTimes: DataWrapper({ $ref: 'NodeEditTimes' }),
	},
	required: ['name', 'type', 'rootNode', 'creator', 'createdAt'],
}, 'Map');
