import { AddSchema } from 'Utils/FrameworkOverrides';

export class Layer {
	constructor(initialData: {name: string, creator: string} & Partial<Layer>) {
		this.Extend(initialData);
	}

	_key: string;
	name: string;
	creator: string;
	createdAt: number;

	mapsWhereEnabled: {[key: number]: boolean};
	nodeSubnodes: {[key: number]: LayerNodeSubnodes}; // key: node-id
}
AddSchema({
	properties: {
		name: { type: 'string' },
		creator: { type: 'string' },
		createdAt: { type: 'number' },

		mapsWhereEnabled: { patternProperties: { '^[A-Za-z0-9_-]+$': { type: 'boolean' } } },
		nodeSubnodes: { patternProperties: { '^[A-Za-z0-9_-]+$': { $ref: 'LayerNodeSubnodes' } } },
	},
	required: ['name', 'creator', 'createdAt'],
}, 'Layer');

export type LayerNodeSubnodes = {[key: number]: boolean}; // key: subnode-id
AddSchema({ patternProperties: { '^[A-Za-z0-9_-]+$': { type: 'boolean' } } }, 'LayerNodeSubnodes');
