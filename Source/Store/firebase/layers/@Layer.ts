import { AddSchema } from 'Utils/FrameworkOverrides';
import { UUID_regex } from 'Utils/General/KeyGenerator';

export class Layer {
	constructor(initialData: {name: string, creator: string} & Partial<Layer>) {
		this.Extend(initialData);
	}

	_key: string;
	name: string;
	creator: string;
	createdAt: number;

	mapsWhereEnabled: {[key: string]: boolean};
	nodeSubnodes: {[key: string]: LayerNodeSubnodes}; // key: node-id
}
AddSchema('Layer', {
	properties: {
		name: { type: 'string' },
		creator: { type: 'string' },
		createdAt: { type: 'number' },

		mapsWhereEnabled: { patternProperties: { [UUID_regex]: { type: 'boolean' } } },
		nodeSubnodes: { patternProperties: { [UUID_regex]: { $ref: 'LayerNodeSubnodes' } } },
	},
	required: ['name', 'creator', 'createdAt'],
});

export type LayerNodeSubnodes = {[key: string]: boolean}; // key: subnode-id
AddSchema('LayerNodeSubnodes', { patternProperties: { [UUID_regex]: { type: 'boolean' } } });
