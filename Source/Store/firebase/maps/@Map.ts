import { GetValues_ForSchema } from 'js-vextensions';
import { AddSchema } from 'vwebapp-framework';
import { UUID_regex } from 'Utils/General/KeyGenerator';
import { ObservableMap } from 'mobx';

export enum MapType {
	Private = 10,
	Public = 20,
	Global = 30,
}
export class Map {
	constructor(initialData: {name: string, type: MapType, creator: string} & Partial<Map>) {
		this.Extend(initialData);
		// this.createdAt = Date.now();
	}

	_key: string;
	name: string;
	note: string;
	noteInline = true;
	type: MapType;
	rootNode: string;
	defaultExpandDepth = 2;
	requireMapEditorsCanEdit = true;
	editorIDs: string[];

	creator: string;
	createdAt: number;
	edits: number;
	editedAt: number;

	layers: {[key: string]: boolean};
	timelines: {[key: string]: boolean};
}
export const Map_namePattern = '^[a-zA-Z0-9 ,\'"%:.?\\-()\\/]+$';
// export const Map_namePattern = '^\\S.*$'; // must start with non-whitespace // todo: probably switch to a more lax pattern like this, eg. so works for other languages
AddSchema('Map', {
	properties: {
		name: { type: 'string', pattern: Map_namePattern },
		note: { type: 'string' },
		noteInline: { type: 'boolean' },
		type: { oneOf: GetValues_ForSchema(MapType) },
		rootNode: { type: 'string' },
		defaultExpandDepth: { type: 'number' },
		// editors: { patternProperties: { [UUID_regex]: { type: 'boolean' } } },
		requireMapEditorsCanEdit: { type: 'boolean' },
		editorIDs: { items: { type: 'string' } },

		creator: { type: 'string' },
		createdAt: { type: 'number' },
		edits: { type: 'number' },
		editedAt: { type: 'number' },

		layers: { patternProperties: { [UUID_regex]: { type: 'boolean' } } },
		timelines: { patternProperties: { [UUID_regex]: { type: 'boolean' } } },
	},
	required: ['name', 'type', 'rootNode', 'creator', 'createdAt'],
});
