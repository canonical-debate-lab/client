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
AddSchema({
	properties: {
		name: { type: 'string' },
		creator: { type: 'string' },
		createdAt: { type: 'number' },

		mapsWhereEnabled: { patternProperties: { [UUID_regex]: { type: 'boolean' } } },
		nodeSubnodes: { patternProperties: { [UUID_regex]: { $ref: 'LayerNodeSubnodes' } } },
	},
	required: ['name', 'creator', 'createdAt'],
}, 'Layer');

export type LayerNodeSubnodes = {[key: string]: boolean}; // key: subnode-id
AddSchema({ patternProperties: { [UUID_regex]: { type: 'boolean' } } }, 'LayerNodeSubnodes');
